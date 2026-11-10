import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, ok, err, getPagination, auditLog } from "@/lib/api";

// Public / Authenticated GET for Products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isFeatured = searchParams.get("featured");
    const { page, limit, skip } = getPagination(req);

    const where: any = { isActive: true };

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
          variants: true,
          inventoryItems: {
            select: { qtyOnHand: true, warehouseId: true },
          },
        },
        orderBy: { sortOrder: "asc" },
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
        shelfLifeHours,
        isFeatured = false,
      } = body;

      if (!sku || !nameAr || !nameEn || !slug || !categoryId || retailPrice === undefined) {
        return err("يرجى ملء كافة الحقول الإلزامية للمنتج", 400);
      }

      const existing = await prisma.product.findFirst({
        where: { OR: [{ sku }, { slug }] },
      });

      if (existing) {
        return err("رمز المنتج (SKU) أو الرابط المختصر (slug) مستخدم بالفعل", 400);
      }

      const product = await prisma.product.create({
        data: {
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
          weight: weight ? parseFloat(weight) : null,
          retailPrice: parseFloat(retailPrice),
          costPrice: parseFloat(costPrice),
          taxRate: parseFloat(taxRate),
          shelfLifeHours: shelfLifeHours ? parseInt(shelfLifeHours) : null,
          isFeatured,
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
