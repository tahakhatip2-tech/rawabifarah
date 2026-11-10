"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Save, Wheat, CheckCircle2 } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sku: `PRD-${Date.now().toString().slice(-4)}`,
    slug: "",
    nameAr: "",
    nameEn: "",
    categoryId: "000000000000000000000020",
    retailPrice: "",
    costPrice: "",
    taxRate: "16",
    unit: "piece",
    weight: "",
    shelfLifeHours: "24",
    descriptionAr: "",
    allergens: [] as string[],
    isFeatured: false,
  });

  const allergensList = [
    { id: "gluten", label: "جلوتين القمح" },
    { id: "dairy", label: "حليب ومشتقاته" },
    { id: "eggs", label: "بيض" },
    { id: "nuts", label: "مكسرات وفستق" },
    { id: "sesame", label: "سمسم" },
  ];

  const handleAllergenToggle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(id)
        ? prev.allergens.filter((a) => a !== id)
        : [...prev.allergens, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug: formData.slug || formData.sku.toLowerCase(),
          retailPrice: parseFloat(formData.retailPrice),
          costPrice: parseFloat(formData.costPrice || "0"),
          taxRate: parseFloat(formData.taxRate),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("تم إضافة المنتج بنجاح!");
        router.push("/admin/products");
      } else {
        alert(data.error || "فشل إضافة المنتج، يرجى مراجعة الحقول");
      }
    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ أثناء حفظ المنتج");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 mb-1 font-semibold"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة لقائمة المنتجات</span>
          </Link>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Wheat className="w-6 h-6 text-amber-600" />
            <span>إضافة صنف مخبوزات جديد</span>
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4">
          <h2 className="text-xs font-bold text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800 pb-2">
            المعلومات الأساسية
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                اسم المنتج بالعربية *
              </label>
              <input
                type="text"
                required
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="مثال: خبز طابون بلدي"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                اسم المنتج بالإنجليزية *
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="Taboon Bread"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                رمز الصنف (SKU) *
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:border-amber-500 text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                الرابط المختصر (Slug)
              </label>
              <input
                type="text"
                dir="ltr"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="taboon-bread"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:border-amber-500 text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              وصف المنتج
            </label>
            <textarea
              rows={2}
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              placeholder="وصف مكونات المنتج ومذاقه وطريقة تقديمه..."
              className="w-full px-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Pricing & Tax */}
        <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4">
          <h2 className="text-xs font-bold text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800 pb-2">
            التسعير والتكلفة (بالدينار الأردني JOD)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                سعر البيع للجمهور (د.أ) *
              </label>
              <input
                type="number"
                step="0.001"
                required
                value={formData.retailPrice}
                onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                placeholder="1.500"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                تكلفة الإنتاج التقديرية (د.أ)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="0.650"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                نسبة ضريبة المبيعات (%)
              </label>
              <select
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              >
                <option value="16">16% (معجنات وحلويات عامة)</option>
                <option value="0">0% (خبز أساسي معفى)</option>
                <option value="4">4% (مدخلات خاصة)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                وحدة البيع
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              >
                <option value="piece">قطعة</option>
                <option value="kg">كيلوغرام (كغ)</option>
                <option value="pack">ربطة / عبوة</option>
                <option value="dozen">درزن (12 قطعة)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Allergens & Shelf life */}
        <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4">
          <h2 className="text-xs font-bold text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800 pb-2">
            مسببات الحساسية والصلاحية
          </h2>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              يحتوي على مسببات الحساسية التالية:
            </label>
            <div className="flex flex-wrap gap-2">
              {allergensList.map((a) => {
                const checked = formData.allergens.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleAllergenToggle(a.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      checked
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/products"
            className="px-6 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            إلغاء
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? "جاري الحفظ..." : "حفظ وإضافة المنتج"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
