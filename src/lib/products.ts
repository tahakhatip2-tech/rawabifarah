import { prisma } from "@/lib/db";

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

export async function getProductWithRelated(idOrSlug: string) {
  const isObjectId = OBJECT_ID_REGEX.test(idOrSlug);

  const product = await prisma.product.findFirst({
    where: isObjectId
      ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug },
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

  if (!product) {
    return null;
  }

  // 1. Prioritize products from the exact same category
  const sameCategory = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 6,
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      category: {
        select: { id: true, nameAr: true, slug: true },
      },
    },
  });

  // 2. Fetch complementary/featured products from other categories to keep showcase rich
  const excludedIds = [product.id, ...sameCategory.map((item) => item.id)];
  const needed = Math.max(3, 6 - sameCategory.length);
  const suggested = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { notIn: excludedIds },
    },
    take: needed,
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      category: {
        select: { id: true, nameAr: true, slug: true },
      },
    },
  });

  const categories = await prisma.productCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, nameAr: true, slug: true },
  });

  return { product, sameCategory, suggested, categories };
}

