import { prisma } from "@/lib/db";
import { withAuth, ok, err } from "@/lib/api";

export const GET = withAuth(async (_req, ctx) => {
  try {
    const [customer, merchant] = await Promise.all([
      prisma.customer.findUnique({
        where: { userId: ctx.userId },
        select: { id: true },
      }),
      prisma.merchantAccount.findUnique({
        where: { userId: ctx.userId },
        select: { id: true },
      }),
    ]);

    const orFilters: Array<{ customerId?: string; merchantId?: string }> = [];
    if (customer) orFilters.push({ customerId: customer.id });
    if (merchant) orFilters.push({ merchantId: merchant.id });

    if (orFilters.length === 0) {
      return ok({ orders: [] });
    }

    const orders = await prisma.salesOrder.findMany({
      where: { OR: orFilters },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        channel: true,
        deliveryType: true,
        subtotal: true,
        taxAmount: true,
        deliveryFee: true,
        total: true,
        notes: true,
        createdAt: true,
        branch: { select: { nameAr: true } },
        items: {
          select: {
            id: true,
            productId: true,
            nameAr: true,
            nameEn: true,
            qty: true,
            unitPrice: true,
            total: true,
            product: { select: { images: true, unit: true, isActive: true } },
          },
        },
      },
    });

    return ok({ orders });
  } catch (error) {
    console.error("[Orders My GET Error]:", error);
    return err("تعذر تحميل طلباتك حالياً", 500);
  }
});

