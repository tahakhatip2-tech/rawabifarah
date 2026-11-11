import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, ok, err, auditLog } from "@/lib/api";
import { generateUniqueEan13 } from "@/lib/barcode-server";

export const POST = withAuth(async (req: NextRequest, ctx) => {
  try {
    const missing = await prisma.product.findMany({
      where: {
        barcodes: { none: {} },
      },
      select: { id: true, nameAr: true },
    });

    if (missing.length === 0) {
      return ok({ count: 0, message: "جميع المنتجات تملك باركود مسبقاً" });
    }

    const createdResults: Array<{ productId: string; code: string }> = [];
    for (let i = 0; i < missing.length; i++) {
      const code = await generateUniqueEan13(i * 31);
      await prisma.barcode.create({
        data: {
          productId: missing[i].id,
          code,
          type: "EAN13",
        },
      });
      createdResults.push({ productId: missing[i].id, code });
    }

    await auditLog({
      userId: ctx.userId,
      action: "BACKFILL_BARCODES",
      entity: "Barcode",
      newData: { count: createdResults.length },
      req,
    });

    return ok({
      count: createdResults.length,
      message: `تم توليد باركود لـ ${createdResults.length} منتج بنجاح`,
    });
  } catch (error) {
    console.error("[Barcode Backfill Error]:", error);
    return err("تعذر توليد الباركود للمنتجات", 500);
  }
}, "products:update");

