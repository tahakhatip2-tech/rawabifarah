import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { withAuth, ok, err, auditLog } from "@/lib/api";
import { UserRole } from "@prisma/client";

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

function sanitizeImages(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    .map((u) => u.trim())
    .slice(0, 5);
}

async function findProductByIdOrSlug(idOrSlug: string) {
  const isObjectId = OBJECT_ID_REGEX.test(idOrSlug);
  return prisma.product.findFirst({
    where: isObjectId ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug },
    include: {
      category: {
        select: { id: true, nameAr: true, nameEn: true, slug: true },
      },
      variants: {
        where: { isActive: true },
      },
      inventoryItems: {
        select: { qtyOnHand: true, warehouseId: true },
      },
    },
  });
}

// Public GET single product details (+ related products)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await findProductByIdOrSlug(id);

    if (!product) {
      return err("المنتج غير موجود", 404);
    }

    if (!product.isActive) {
      const session = await auth();
      const canViewInactive = session?.user
        ? hasPermission(
            session.user.permissions ?? [],
            session.user.role as UserRole,
            PERMISSIONS.PRODUCTS_VIEW
          )
        : false;
      if (!canViewInactive) {
        return err("المنتج غير متاح حالياً", 404);
      }
    }

    const related = await prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: 3,
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      include: {
        category: {
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
      },
    });

    return ok({ product, related });
  } catch (error) {
    console.error("[Product GET by ID Error]:", error);
    return err("فشل جلب تفاصيل المنتج", 500);
  }
}

// Protected PATCH: Update product and its up to 5 images
export const PATCH = withAuth(async (req, ctx, paramsPromise) => {
  try {
    const { id } = await paramsPromise;
    if (!OBJECT_ID_REGEX.test(id)) {
      return err("معرف المنتج غير صالح", 400);
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return err("المنتج غير موجود", 404);
    }

    const body = await req.json();
    const {
      sku,
      nameAr,
      nameEn,
      slug,
      descriptionAr,
      descriptionEn,
      ingredientsAr,
      ingredientsEn,
      images,
      categoryId,
      unit,
      weight,
      retailPrice,
      costPrice,
      taxRate,
      allergens,
      shelfLifeHours,
      isActive,
      isFeatured,
      isSeasonal,
    } = body;

    const nextSku = sku !== undefined ? String(sku).trim() : existing.sku;
    const nextSlug = slug !== undefined ? String(slug).trim().toLowerCase() : existing.slug;

    if (nextSku !== existing.sku || nextSlug !== existing.slug) {
      const conflict = await prisma.product.findFirst({
        where: {
          id: { not: id },
          OR: [{ sku: nextSku }, { slug: nextSlug }],
        },
      });
      if (conflict) {
        return err("رمز المنتج (SKU) أو الرابط المختصر (slug) مستخدم لمنتج آخر", 400);
      }
    }

    const data: Record<string, any> = {
      sku: nextSku,
      slug: nextSlug,
    };

    if (nameAr !== undefined) data.nameAr = String(nameAr).trim();
    if (nameEn !== undefined) data.nameEn = String(nameEn).trim();
    if (descriptionAr !== undefined)
      data.descriptionAr = descriptionAr ? String(descriptionAr).trim() : null;
    if (descriptionEn !== undefined)
      data.descriptionEn = descriptionEn ? String(descriptionEn).trim() : null;
    if (ingredientsAr !== undefined)
      data.ingredientsAr = ingredientsAr ? String(ingredientsAr).trim() : null;
    if (ingredientsEn !== undefined)
      data.ingredientsEn = ingredientsEn ? String(ingredientsEn).trim() : null;
    if (images !== undefined) data.images = sanitizeImages(images);
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (unit !== undefined) data.unit = unit;
    if (weight !== undefined) data.weight = weight ? parseFloat(weight) : null;
    if (retailPrice !== undefined) data.retailPrice = parseFloat(retailPrice);
    if (costPrice !== undefined) data.costPrice = parseFloat(costPrice || "0");
    if (taxRate !== undefined) data.taxRate = parseFloat(taxRate);
    if (allergens !== undefined)
      data.allergens = Array.isArray(allergens) ? allergens : [];
    if (shelfLifeHours !== undefined)
      data.shelfLifeHours = shelfLifeHours ? parseInt(shelfLifeHours) : null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured);
    if (isSeasonal !== undefined) data.isSeasonal = Boolean(isSeasonal);

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });

    await auditLog({
      userId: ctx.userId,
      action: "UPDATE_PRODUCT",
      entity: "Product",
      entityId: id,
      oldData: existing,
      newData: updated,
      req,
    });

    return ok(updated);
  } catch (error: any) {
    console.error("[Product PATCH Error]:", error);
    return err("فشل تحديث بيانات المنتج: " + (error.message || "خطأ غير متوقع"), 500);
  }
}, "products:update");

// Protected DELETE: Archive or delete product
export const DELETE = withAuth(async (req, ctx, paramsPromise) => {
  try {
    const { id } = await paramsPromise;
    if (!OBJECT_ID_REGEX.test(id)) {
      return err("معرف المنتج غير صالح", 400);
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return err("المنتج غير موجود", 404);
    }

    // Soft-deactivate to preserve order history integrity
    const archived = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await auditLog({
      userId: ctx.userId,
      action: "ARCHIVE_PRODUCT",
      entity: "Product",
      entityId: id,
      oldData: existing,
      newData: archived,
      req,
    });

    return ok({ archived: true, id });
  } catch (error) {
    console.error("[Product DELETE Error]:", error);
    return err("فشل أرشفة المنتج", 500);
  }
}, "products:delete");

