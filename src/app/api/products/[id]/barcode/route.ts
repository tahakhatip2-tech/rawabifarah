import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, ok, err, auditLog } from "@/lib/api";
import { generateUniqueEan13 } from "@/lib/barcode-server";

export const POST = withAuth(
  async (req: NextRequest, ctx, paramsPromise: Promise<{ id: string }>) => {
    const { id } = await paramsPromise;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { barcodes: true },
    });
    if (!product) {
      return err("المنتج غير موجود", 404);
    }

    const body = (await req.json().catch(() => null)) as { forceNew?: boolean } | null;
    if (product.barcodes.length > 0 && !body?.forceNew) {
      return ok({ barcode: product.barcodes[0], barcodes: product.barcodes });
    }

    const code = await generateUniqueEan13();
    const created = await prisma.barcode.create({
      data: {
        productId: product.id,
        code,
        type: "EAN13",
      },
    });

    await auditLog({
      userId: ctx.userId,
      action: "GENERATE_BARCODE",
      entity: "Barcode",
      entityId: created.id,
      newData: { productId: product.id, code: created.code },
      req,
    });

    return ok({ barcode: created, barcodes: [...product.barcodes, created] }, 201);
  },
  "products:update"
);

