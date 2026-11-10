"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import {
  Package,
  AlertTriangle,
  ArrowUpDown,
  Search,
  Filter,
  Plus,
  Minus,
  CheckCircle2,
  X,
  Warehouse as WarehouseIcon,
  RotateCcw,
} from "lucide-react";

interface InventoryRow {
  id: string;
  sku: string;
  nameAr: string;
  warehouse: string;
  qtyOnHand: number;
  reorderPoint: number;
  unit: string;
  unitCost: number;
  lastUpdated: string;
}

const INITIAL_INVENTORY: InventoryRow[] = [
  {
    id: "inv-1",
    sku: "RAW-FLOUR-001",
    nameAr: "دقيق قمح بلدي فاخر (شوال 50 كغ)",
    warehouse: "المستودع الرئيسي",
    qtyOnHand: 45,
    reorderPoint: 20,
    unit: "شوال",
    unitCost: 18.5,
    lastUpdated: "2026-10-13 14:30",
  },
  {
    id: "inv-2",
    sku: "RAW-BUTTER-002",
    nameAr: "زبدة طبيعية فرنسية 82% (كرتونة)",
    warehouse: "المستودع الرئيسي",
    qtyOnHand: 8,
    reorderPoint: 15,
    unit: "كرتونة",
    unitCost: 45.0,
    lastUpdated: "2026-10-13 10:15",
  },
  {
    id: "inv-3",
    sku: "RAW-CHEESE-003",
    nameAr: "جبنة نابلسية بلدية مغلية (تنكة)",
    warehouse: "المستودع الرئيسي",
    qtyOnHand: 5,
    reorderPoint: 10,
    unit: "تنكة",
    unitCost: 65.0,
    lastUpdated: "2026-10-12 18:00",
  },
  {
    id: "inv-4",
    sku: "RAW-PIST-004",
    nameAr: "فستق حلبي حب أخضر نخب أول",
    warehouse: "المستودع الرئيسي",
    qtyOnHand: 18,
    reorderPoint: 25,
    unit: "كغم",
    unitCost: 19.5,
    lastUpdated: "2026-10-13 16:20",
  },
  {
    id: "inv-5",
    sku: "RAW-SUGAR-005",
    nameAr: "سكر أبيض ناعم (شوال 50 كغ)",
    warehouse: "المستودع الرئيسي",
    qtyOnHand: 35,
    reorderPoint: 15,
    unit: "شوال",
    unitCost: 22.0,
    lastUpdated: "2026-10-11 11:00",
  },
  {
    id: "inv-6",
    sku: "RAW-GHEE-006",
    nameAr: "سمن بلدي أردني أصيل",
    warehouse: "المستودع الرئيسي",
    qtyOnHand: 30,
    reorderPoint: 12,
    unit: "كغم",
    unitCost: 14.0,
    lastUpdated: "2026-10-13 12:45",
  },
];

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryRow[]>(INITIAL_INVENTORY);
  const [search, setSearch] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryRow | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("جرد دوري");

  const filtered = items.filter((item) => {
    const matchSearch =
      item.nameAr.includes(search) || item.sku.toLowerCase().includes(search.toLowerCase());
    const matchLow = !lowStockFilter || item.qtyOnHand <= item.reorderPoint;
    return matchSearch && matchLow;
  });

  const lowStockCount = items.filter((i) => i.qtyOnHand <= i.reorderPoint).length;
  const totalStockValue = items.reduce((acc, i) => acc + i.qtyOnHand * i.unitCost, 0);

  const handleApplyAdjustment = () => {
    if (!adjustModalItem || !adjustQty) return;
    const delta = parseFloat(adjustQty);
    if (isNaN(delta)) return;

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === adjustModalItem.id) {
          return {
            ...i,
            qtyOnHand: Math.max(0, i.qtyOnHand + delta),
            lastUpdated: new Date().toISOString().slice(0, 16).replace("T", " "),
          };
        }
        return i;
      })
    );

    setAdjustModalItem(null);
    setAdjustQty("");
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" />
            <span>إدارة المخزون والمواد الأولية</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            متابعة أرصدة المستودعات، حركات المواد الخام، وتنبيهات إعادة الطلب
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
          <span className="text-xs text-stone-500">إجمالي الأصناف بالمستودع</span>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100 font-mono">
            {items.length}
          </div>
          <span className="text-[11px] text-stone-400">المستودع الرئيسي — عمّان</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
          <span className="text-xs text-stone-500">مواد قاربت على النفاد (تنبيه)</span>
          <div className="text-2xl font-black text-red-500 font-mono flex items-center gap-2">
            <span>{lowStockCount}</span>
            {lowStockCount > 0 && <AlertTriangle className="w-5 h-5 text-red-500" />}
          </div>
          <span className="text-[11px] text-red-400">تتطلب إصدار أمر شراء توريد</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
          <span className="text-xs text-stone-500">القيمة التقديرية للمخزون</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {formatCurrency(totalStockValue)}
          </div>
          <span className="text-[11px] text-stone-400">سعر التكلفة الفعلي</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث عن مادة خام أو SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={() => setLowStockFilter(!lowStockFilter)}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
            lowStockFilter
              ? "bg-red-50 dark:bg-red-950/40 text-red-600 border-red-300 dark:border-red-800"
              : "bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>المواد المنخفضة فقط ({lowStockCount})</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold">
              <tr>
                <th className="py-3 px-4">المادة الخام</th>
                <th className="py-3 px-4">رمز الصنف</th>
                <th className="py-3 px-4">الرصيد الفعلي</th>
                <th className="py-3 px-4">حد إعادة الطلب</th>
                <th className="py-3 px-4">تكلفة الوحدة (د.أ)</th>
                <th className="py-3 px-4">القيمة الإجمالية</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">تعديل جرد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filtered.map((item) => {
                const isLow = item.qtyOnHand <= item.reorderPoint;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition"
                  >
                    <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">
                      {item.nameAr}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-500">{item.sku}</td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={isLow ? "text-red-500 text-sm" : "text-stone-900 dark:text-stone-100"}>
                        {item.qtyOnHand} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-500">
                      {item.reorderPoint} {item.unit}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-700 dark:text-amber-400">
                      {formatCurrency(item.qtyOnHand * item.unitCost)}
                    </td>
                    <td className="py-3 px-4">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-[10px] font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>تحت الحد</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>متوفر</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setAdjustModalItem(item);
                          setAdjustQty("");
                        }}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-700 dark:text-stone-300 font-bold text-[11px] transition inline-flex items-center gap-1"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        <span>تعديل</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Adjust Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-amber-600" />
                <span>تعديل رصيد المخزون: {adjustModalItem.nameAr}</span>
              </h3>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex justify-between text-xs">
              <span className="text-stone-500">الرصيد الفعلي الحالي:</span>
              <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                {adjustModalItem.qtyOnHand} {adjustModalItem.unit}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  كمية التعديل (أدخل + للزيادة أو - للنقصان):
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="مثال: +10 أو -2"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm font-mono text-stone-900 dark:text-stone-100 text-center focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  سبب التعديل:
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="تسوية جرد فعلي">تسوية جرد فعلي</option>
                  <option value="استلام توريد جديد">استلام توريد جديد</option>
                  <option value="تلف / هدر في الإنتاج">تلف / هدر في الإنتاج</option>
                  <option value="عينة فحص مخبري">عينة فحص مخبري</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAdjustModalItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleApplyAdjustment}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
              >
                تطبيق التعديل وحفظ السجل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
