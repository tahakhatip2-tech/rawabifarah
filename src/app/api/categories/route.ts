import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, ok, err, auditLog } from "@/lib/api";

export async function GET() {
  try {
    const categories = await prisma.productCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return ok(categories);
  } catch (error: any) {
    console.error("[Categories GET Error]:", error);
    return err("فشل جلب تصنيفات المنتجات", 500);
  }
}

export const POST = withAuth(
  async (req, ctx) => {
    try {
      const body = await req.json();
      const { nameAr, nameEn, slug, image, sortOrder = 0, parentId } = body;

      if (!nameAr || !nameEn || !slug) {
        return err("يرجى ملء اسم التصنيف والرابط المختصر", 400);
      }

      const existing = await prisma.productCategory.findUnique({
        where: { slug },
      });

      if (existing) {
        return err("الرابط المختصر للتصنيف مستخدم بالفعل", 400);
      }

      const category = await prisma.productCategory.create({
        data: {
          nameAr,
          nameEn,
          slug,
          image,
          sortOrder: parseInt(sortOrder),
          parentId: parentId || null,
        },
      });

      await auditLog({
        userId: ctx.userId,
        action: "CREATE_CATEGORY",
        entity: "ProductCategory",
        entityId: category.id,
        newData: category,
        req,
      });

      return ok(category, 201);
    } catch (error: any) {
      console.error("[Categories POST Error]:", error);
      return err("فشل إنشاء التصنيف: " + (error.message || "خطأ غير متوقع"), 500);
    }
  },
  "products:create"
);
