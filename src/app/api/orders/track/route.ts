import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/api";

const trackSchema = z.object({
  orderNumber: z.string().trim().min(4, "يرجى إدخال رقم الطلب").max(40),
  phone: z.string().trim().min(7, "يرجى إدخال رقم الهاتف المسجل").max(25),
});

function normalizeDigits(val: string): string {
  return val.replace(/\D/g, "").slice(-9);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "بيانات التتبع غير صالحة", 400);
    }

    const order = await prisma.salesOrder.findFirst({
      where: {
        orderNumber: { equals: parsed.data.orderNumber.trim(), mode: "insensitive" },
      },
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
        snapshotData: true,
        createdAt: true,
        branch: { select: { nameAr: true } },
        customer: { select: { phone: true } },
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

    if (!order) {
      return err("لم يتم العثور على طلب بهذا الرقم", 404);
    }

    const reqPhone = normalizeDigits(parsed.data.phone);
    const snapshot = (order.snapshotData ?? {}) as Record<string, unknown>;
    const candidatePhones = [
      order.customer?.phone,
      typeof snapshot.customerPhone === "string" ? snapshot.customerPhone : undefined,
      order.notes ?? undefined,
    ]
      .filter((v): v is string => Boolean(v))
      .map(normalizeDigits)
      .filter((d) => d.length >= 7);

    const matched = candidatePhones.some((d) => d === reqPhone);
    if (!matched) {
      return err("رقم الهاتف لا يطابق هذا الطلب", 403);
    }

    return ok({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        channel: order.channel,
        deliveryType: order.deliveryType,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        deliveryFee: order.deliveryFee,
        total: order.total,
        createdAt: order.createdAt,
        branch: order.branch,
        items: order.items,
      },
    });
  } catch (error) {
    console.error("[Orders Track POST Error]:", error);
    return err("تعذر تتبع الطلب حالياً", 500);
  }
}

