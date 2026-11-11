import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { ProductForm } from "@/components/admin/ProductForm";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/products");
  }

  const canUpdate = hasPermission(
    session.user.permissions ?? [],
    session.user.role as UserRole,
    PERMISSIONS.PRODUCTS_UPDATE
  );
  if (!canUpdate) {
    redirect("/unauthorized");
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      mode="edit"
      initialProduct={{
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        categoryId: product.categoryId,
        retailPrice: product.retailPrice,
        costPrice: product.costPrice,
        taxRate: product.taxRate,
        unit: product.unit,
        weight: product.weight,
        shelfLifeHours: product.shelfLifeHours,
        descriptionAr: product.descriptionAr,
        ingredientsAr: product.ingredientsAr,
        allergens: product.allergens,
        images: product.images,
        isFeatured: product.isFeatured,
        isSeasonal: product.isSeasonal,
        isActive: product.isActive,
      }}
    />
  );
}

