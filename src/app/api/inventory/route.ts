import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, ok, err, getPagination, auditLog } from "@/lib/api";
import { MovementType } from "@prisma/client";

export const GET = withAuth(
  async (req, ctx) => {
    try {
      const { searchParams } = req.nextUrl;
      const warehouseId = searchParams.get("warehouseId");
      const lowStockOnly = searchParams.get("lowStock") === "true";
      const { page, limit, skip } = getPagination(req);

      const where: any = {};
      if (warehouseId) where.warehouseId = warehouseId;

      const [items, total] = await Promise.all([
        prisma.inventoryItem.findMany({
          where,
          skip,
          take: limit,
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                nameAr: true,
                nameEn: true,
                unit: true,
                retailPrice: true,
                costPrice: true,
                category: { select: { nameAr: true } },
              },
            },
            warehouse: {
              select: { id: true, nameAr: true, nameEn: true },
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.inventoryItem.count({ where }),
      ]);

      const itemsWithAlerts = items.map((item) => ({
        ...item,
        isLowStock: item.qtyOnHand <= item.reorderPoint,
      }));

      const finalItems = lowStockOnly
        ? itemsWithAlerts.filter((i) => i.isLowStock)
        : itemsWithAlerts;

      return ok({
        items: finalItems,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error("[Inventory GET Error]:", error);
      return err("فشل جلب بيانات المخزون", 500);
    }
  },
  "inventory:view"
);

// POST: Stock Adjustment / Inbound / Outbound
export const POST = withAuth(
  async (req, ctx) => {
    try {
      const body = await req.json();
      const {
        inventoryItemId,
        productId,
        warehouseId,
        type = "ADJUSTMENT",
        qtyChange, // e.g. +10 or -5
        reason,
        notes,
      } = body;

      if (!qtyChange || isNaN(Number(qtyChange))) {
        return err("يرجى تحديد كمية التعديل بشكل صحيح", 400);
      }

      const delta = Number(qtyChange);

      // Find or create inventory item
      let targetItem = null;
      if (inventoryItemId) {
        targetItem = await prisma.inventoryItem.findUnique({
          where: { id: inventoryItemId },
        });
      } else if (productId && warehouseId) {
        targetItem = await prisma.inventoryItem.findUnique({
          where: {
            productId_warehouseId: { productId, warehouseId },
          },
        });
      }

      if (!targetItem && productId && warehouseId) {
        targetItem = await prisma.inventoryItem.create({
          data: {
            productId,
            warehouseId,
            qtyOnHand: 0,
            reorderPoint: 5,
          },
        });
      }

      if (!targetItem) {
        return err("لم يتم العثور على سجل المخزون المطلوب", 404);
      }

      const qtyBefore = targetItem.qtyOnHand;
      const qtyAfter = Math.max(0, qtyBefore + delta);

      const [updatedItem, movement] = await prisma.$transaction([
        prisma.inventoryItem.update({
          where: { id: targetItem.id },
          data: { qtyOnHand: qtyAfter },
        }),
        prisma.stockMovement.create({
          data: {
            inventoryItemId: targetItem.id,
            type: (type as MovementType) || MovementType.ADJUSTMENT,
            qty: Math.abs(delta),
            qtyBefore,
            qtyAfter,
            referenceType: "MANUAL_ADJUSTMENT",
            reason: reason || notes || "تعديل يدوي للمخزون",
            userId: ctx.userId,
            branchId: ctx.branchId || "000000000000000000000002",
          },
        }),
      ]);

      await auditLog({
        userId: ctx.userId,
        action: "STOCK_ADJUSTMENT",
        entity: "InventoryItem",
        entityId: targetItem.id,
        oldData: { qtyOnHand: qtyBefore },
        newData: { qtyOnHand: qtyAfter, delta, reason },
        req,
      });

      return ok({ item: updatedItem, movement }, 200);
    } catch (error: any) {
      console.error("[Inventory POST Error]:", error);
      return err("فشل تعديل المخزون: " + (error.message || "خطأ غير متوقع"), 500);
    }
  },
  "inventory:adjust"
);
