import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { withAuth, ok, err, getPagination, auditLog } from "@/lib/api";
import { UserRole } from "@prisma/client";

function sanitizeProductImages(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, 5);
}

// Public / Authenticated GET for Products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isFeatured = searchParams.get("featured");
    const includeInactive = searchParams.get("all") === "true";
    const { page, limit, skip } = getPagination(req);

    const where: Record<string, any> = {};

    if (includeInactive) {
      const session = await auth();
      const canViewAll = session?.user
        ? hasPermission(
            session.user.permissions ?? [],
            session.user.role as UserRole,
            PERMISSIONS.PRODUCTS_VIEW
          )
        : false;
      if (!canViewAll) {
        where.isActive = true;
      }
    } else {
      where.isActive = true;
    }

    if (category) {
      where.categoryId = category;
    }

    if (isFeatured === "true") {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: "insensitive" } },
        { nameEn: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.product.count({ where }),
    ]);

    return ok({
      items: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[Products GET Error]:", error);
    return err("فشل جلب المنتجات", 500);
  }
}

// Protected POST: Create new product
export const POST = withAuth(
  async (req, ctx) => {
    try {
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
        images = [],
        categoryId,
        unit = "piece",
        weight,
        retailPrice,
        costPrice = 0,
        taxRate = 16,
        allergens = [],
        shelfLifeHours,
        isActive = true,
        isFeatured = false,
        isSeasonal = false,
      } = body;

      if (!nameAr || !categoryId || retailPrice === undefined) {
        return err("يرجى ملء كافة الحقول الإلزامية للمنتج", 400);
      }

      const resolvedSku =
        sku && String(sku).trim() ? String(sku).trim() : `PRD-${Date.now().toString().slice(-6)}`;
      const resolvedNameEn =
        nameEn && String(nameEn).trim() ? String(nameEn).trim() : String(nameAr).trim();
      const resolvedSlug =
        slug && String(slug).trim() ? String(slug).trim().toLowerCase() : resolvedSku.toLowerCase();

      const existing = await prisma.product.findFirst({
        where: { OR: [{ sku: resolvedSku }, { slug: resolvedSlug }] },
      });

      if (existing) {
        return err("رمز المنتج (SKU) أو الرابط المختصر (slug) مستخدم بالفعل", 400);
      }

      const cleanedImages = sanitizeProductImages(images);

      const product = await prisma.product.create({
        data: {
          sku: resolvedSku,
          nameAr: String(nameAr).trim(),
          nameEn: resolvedNameEn,
          slug: resolvedSlug,
          descriptionAr: descriptionAr ? String(descriptionAr).trim() : null,
          descriptionEn: descriptionEn ? String(descriptionEn).trim() : null,
          ingredientsAr: ingredientsAr ? String(ingredientsAr).trim() : null,
          ingredientsEn: ingredientsEn ? String(ingredientsEn).trim() : null,
          images: cleanedImages,
          categoryId,
          unit,
          weight: weight ? parseFloat(weight) : null,
          retailPrice: parseFloat(retailPrice),
          costPrice: parseFloat(costPrice || "0"),
          taxRate: parseFloat(taxRate ?? "16"),
          allergens: Array.isArray(allergens) ? allergens : [],
          shelfLifeHours: shelfLifeHours ? parseInt(shelfLifeHours) : null,
          isActive: Boolean(isActive),
          isFeatured: Boolean(isFeatured),
          isSeasonal: Boolean(isSeasonal),
        },
        include: {
          category: true,
        },
      });

      await auditLog({
        userId: ctx.userId,
        action: "CREATE_PRODUCT",
        entity: "Product",
        entityId: product.id,
        newData: product,
        req,
      });

      return ok(product, 201);
    } catch (error: any) {
      console.error("[Products POST Error]:", error);
      return err("فشل إنشاء المنتج: " + (error.message || "خطأ غير متوقع"), 500);
    }
  },
  "products:create"
);
