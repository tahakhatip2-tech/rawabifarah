import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, ok, err } from "@/lib/api";

export const GET = withAuth(async (req: NextRequest) => {
  const code = req.nextUrl.searchParams.get("code")?.trim();
  if (!code) {
    return err("يرجى تمرير رمز الباركود", 400);
  }

  const barcodeHit = await prisma.barcode.findUnique({
    where: { code },
    include: {
      product: {
        include: {
          category: { select: { id: true, nameAr: true, slug: true } },
          barcodes: { select: { id: true, code: true, type: true } },
        },
      },
    },
  });

  if (barcodeHit?.product && barcodeHit.product.isActive) {
    return ok({ product: barcodeHit.product, matchedBy: "BARCODE" });
  }

  const skuHit = await prisma.product.findFirst({
    where: { sku: { equals: code, mode: "insensitive" }, isActive: true },
    include: {
      category: { select: { id: true, nameAr: true, slug: true } },
      barcodes: { select: { id: true, code: true, type: true } },
    },
  });

  if (skuHit) {
    return ok({ product: skuHit, matchedBy: "SKU" });
  }

  return err("لم يتم العثور على منتج مطابق لهذا الباركود", 404);
}, "products:view");

