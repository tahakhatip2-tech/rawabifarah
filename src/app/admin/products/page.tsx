"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Wheat,
  Download,
} from "lucide-react";

interface Product {
  id: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  category: string;
  retailPrice: number;
  costPrice: number;
  unit: string;
  taxRate: number;
  isActive: boolean;
  stockQty: number;
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    sku: "PRD-BREAD-001",
    nameAr: "خبز بلدي طازج (ربطة)",
    nameEn: "Fresh Pita Bread",
    category: "الخبز الطازج",
    retailPrice: 0.35,
    costPrice: 0.18,
    unit: "ربطة",
    taxRate: 0,
    isActive: true,
    stockQty: 450,
  },
  {
    id: "2",
    sku: "PRD-PAST-002",
    nameAr: "كرواسون زبدة فرنسي فاخر",
    nameEn: "French Butter Croissant",
    category: "المعجنات",
    retailPrice: 1.25,
    costPrice: 0.45,
    unit: "قطعة",
    taxRate: 16,
    isActive: true,
    stockQty: 85,
  },
  {
    id: "3",
    sku: "PRD-PIE-003",
    nameAr: "مناقيش جبنة نابلسية وزعتر",
    nameEn: "Cheese & Zaatar Pie",
    category: "الفطائر",
    retailPrice: 1.5,
    costPrice: 0.55,
    unit: "قطعة",
    taxRate: 16,
    isActive: true,
    stockQty: 120,
  },
  {
    id: "4",
    sku: "PRD-SWT-004",
    nameAr: "بقلاوة فستق حلبي ملكية (1 كغ)",
    nameEn: "Royal Pistachio Baklava",
    category: "الحلويات الشرقية",
    retailPrice: 14.5,
    costPrice: 7.2,
    unit: "كغم",
    taxRate: 16,
    isActive: true,
    stockQty: 25,
  },
  {
    id: "5",
    sku: "PRD-SWT-005",
    nameAr: "معمول تمر بالسمن البلدي (1 كغ)",
    nameEn: "Date Maamoul with Ghee",
    category: "الحلويات الشرقية",
    retailPrice: 8.5,
    costPrice: 4.1,
    unit: "كغم",
    taxRate: 16,
    isActive: true,
    stockQty: 40,
  },
  {
    id: "6",
    sku: "PRD-BREAD-006",
    nameAr: "خبز باغيت فرنسي مقرمش",
    nameEn: "French Baguette",
    category: "الخبز الطازج",
    retailPrice: 0.65,
    costPrice: 0.25,
    unit: "قطعة",
    taxRate: 16,
    isActive: true,
    stockQty: 95,
  },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const filtered = products.filter((p) => {
    const matchSearch =
      p.nameAr.includes(search) ||
      p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const toggleStatus = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const deleteProduct = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Wheat className="w-6 h-6 text-amber-600" />
            <span>إدارة المنتجات وقائمة الأصناف</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            إدارة كافة أصناف المخبوزات والحلويات، الأسعار، وتكلفة الوصفات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف جديد</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم أو SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-stone-500 shrink-0">التصنيف:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">جميع التصنيفات</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold">
              <tr>
                <th className="py-3 px-4">اسم المنتج</th>
                <th className="py-3 px-4">رمز SKU</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4">سعر البيع (د.أ)</th>
                <th className="py-3 px-4">تكلفة الإنتاج</th>
                <th className="py-3 px-4">الكمية المتوفرة</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filtered.map((p) => {
                const margin = p.retailPrice > 0 ? ((p.retailPrice - p.costPrice) / p.retailPrice) * 100 : 0;
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition"
                  >
                    <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">
                      <div>{p.nameAr}</div>
                      <div className="text-[10px] text-stone-400 font-normal">{p.nameEn}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-500">{p.sku}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-700 dark:text-amber-400">
                      {formatCurrency(p.retailPrice)}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-500">
                      {formatCurrency(p.costPrice)}
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mr-1.5 font-bold">
                        ({margin.toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`font-bold ${
                          p.stockQty < 30 ? "text-red-500" : "text-stone-900 dark:text-stone-100"
                        }`}
                      >
                        {p.stockQty} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleStatus(p.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                          p.isActive
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                            : "bg-stone-100 dark:bg-stone-800 text-stone-400"
                        }`}
                      >
                        {p.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>نشط</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>معطل</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                          title="عرض وتعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
