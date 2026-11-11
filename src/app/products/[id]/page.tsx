import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import {
  ProductDetailClient,
  ProductDetailData,
} from "@/components/public/ProductDetailClient";
import { PublicProductCardItem } from "@/components/public/ProductCard";

export const dynamic = "force-dynamic";

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

async function getProductAndRelated(idOrSlug: string) {
  const isObjectId = OBJECT_ID_REGEX.test(idOrSlug);
  const product = await prisma.product.findFirst({
    where: isObjectId
      ? { isActive: true, OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
      : { isActive: true, slug: idOrSlug },
    include: {
      category: {
        select: { id: true, nameAr: true, nameEn: true, slug: true },
      },
      variants: {
        where: { isActive: true },
      },
    },
  });

  if (!product) return null;

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
        select: { id: true, nameAr: true, slug: true },
      },
    },
  });

  return { product, related };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getProductAndRelated(id);
  if (!result) {
    return { title: "المنتج غير موجود | روابي فرح" };
  }
  const { product } = result;
  const image = product.images?.[0] || "/rwabifarah.png";
  return {
    title: `${product.nameAr} | روابي فرح`,
    description:
      product.descriptionAr ||
      `${product.nameAr} طازج يومياً من أفران مخابز روابي الفرح.`,
    openGraph: {
      title: product.nameAr,
      description: product.descriptionAr || undefined,
      images: [image],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProductAndRelated(id);

  if (!result) {
    notFound();
  }

  const { product, related } = result;

  const detailData: ProductDetailData = {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    ingredientsAr: product.ingredientsAr,
    ingredientsEn: product.ingredientsEn,
    images: product.images || [],
    unit: product.unit,
    weight: product.weight,
    retailPrice: product.retailPrice,
    taxRate: product.taxRate,
    allergens: product.allergens || [],
    shelfLifeHours: product.shelfLifeHours,
    minOrderQty: product.minOrderQty,
    isFeatured: product.isFeatured,
    isSeasonal: product.isSeasonal,
    category: product.category,
    variants: product.variants.map((v) => ({
      id: v.id,
      nameAr: v.nameAr,
      nameEn: v.nameEn,
      price: v.price,
      weight: v.weight,
    })),
  };

  const relatedItems: PublicProductCardItem[] = related.map((item) => ({
    id: item.id,
    slug: item.slug,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    descriptionAr: item.descriptionAr,
    retailPrice: item.retailPrice,
    unit: item.unit,
    images: item.images || [],
    isFeatured: item.isFeatured,
    isSeasonal: item.isSeasonal,
    category: item.category,
  }));

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-stone-900 dark:bg-stone-950 dark:text-stone-100 flex flex-col font-sans transition-colors duration-300">
      <Navbar />
      <main className="flex-1">
        <ProductDetailClient product={detailData} related={relatedItems} />
      </main>
      <Footer />
    </div>
  );
}

