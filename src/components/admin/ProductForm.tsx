"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Save, Wheat, AlertCircle, CheckCircle2 } from "lucide-react";
import { ProductImagesUploader } from "@/components/admin/ProductImagesUploader";

interface CategoryOption {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface ProductFormInitialData {
  id: string;
  sku: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  categoryId: string;
  retailPrice: number;
  costPrice: number;
  taxRate: number;
  unit: string;
  weight?: number | null;
  shelfLifeHours?: number | null;
  descriptionAr?: string | null;
  ingredientsAr?: string | null;
  allergens: string[];
  images: string[];
  isFeatured: boolean;
  isSeasonal: boolean;
  isActive: boolean;
}

interface ProductFormProps {
  mode: "create" | "edit";
  initialProduct?: ProductFormInitialData;
}

const ALLERGENS_LIST = [
  { id: "gluten", label: "جلوتين القمح" },
  { id: "dairy", label: "حليب ومشتقاته" },
  { id: "eggs", label: "بيض" },
  { id: "nuts", label: "مكسرات وفستق" },
  { id: "sesame", label: "سمسم" },
];

export function ProductForm({ mode, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    sku: initialProduct?.sku || `PRD-${Date.now().toString().slice(-4)}`,
    slug: initialProduct?.slug || "",
    nameAr: initialProduct?.nameAr || "",
    nameEn: initialProduct?.nameEn || "",
    categoryId: initialProduct?.categoryId || "",
    retailPrice:
      initialProduct?.retailPrice !== undefined ? String(initialProduct.retailPrice) : "",
    costPrice:
      initialProduct?.costPrice !== undefined ? String(initialProduct.costPrice) : "",
    taxRate: initialProduct?.taxRate !== undefined ? String(initialProduct.taxRate) : "16",
    unit: initialProduct?.unit || "piece",
    weight: initialProduct?.weight ? String(initialProduct.weight) : "",
    shelfLifeHours:
      initialProduct?.shelfLifeHours !== undefined && initialProduct?.shelfLifeHours !== null
        ? String(initialProduct.shelfLifeHours)
        : "24",
    descriptionAr: initialProduct?.descriptionAr || "",
    ingredientsAr: initialProduct?.ingredientsAr || "",
    allergens: initialProduct?.allergens || ([] as string[]),
    images: initialProduct?.images || ([] as string[]),
    isFeatured: initialProduct?.isFeatured ?? false,
    isSeasonal: initialProduct?.isSeasonal ?? false,
    isActive: initialProduct?.isActive ?? true,
  });

  useEffect(() => {
    let active = true;
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        const list: CategoryOption[] = Array.isArray(json?.data) ? json.data : [];
        setCategories(list);
        if (!formData.categoryId && list.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: list[0].id }));
        }
      })
      .catch(() => {
        // Ignore; category dropdown will show fallback message
      })
      .finally(() => {
        if (active) setLoadingCats(false);
      });
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    setFeedback(null);

    if (!formData.categoryId) {
      setFeedback({ kind: "error", text: "يرجى اختيار تصنيف للمنتج." });
      return;
    }

    setSubmitting(true);

    try {
      const endpoint =
        mode === "edit" && initialProduct
          ? `/api/products/${initialProduct.id}`
          : "/api/products";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug: formData.slug.trim() || formData.sku.trim().toLowerCase(),
          retailPrice: parseFloat(formData.retailPrice),
          costPrice: parseFloat(formData.costPrice || "0"),
          taxRate: parseFloat(formData.taxRate),
          weight: formData.weight ? parseFloat(formData.weight) : null,
          shelfLifeHours: formData.shelfLifeHours
            ? parseInt(formData.shelfLifeHours, 10)
            : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          kind: "success",
          text:
            mode === "edit"
              ? "تم تحديث بيانات وصور المنتج بنجاح!"
              : "تم إضافة المنتج وصوره بنجاح!",
        });
        router.push("/admin/products");
        router.refresh();
      } else {
        setFeedback({
          kind: "error",
          text: data.error || "فشل حفظ المنتج، يرجى مراجعة الحقول.",
        });
      }
    } catch {
      setFeedback({
        kind: "error",
        text: "حدث خطأ أثناء الاتصال بالخادم.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
            <span>
              {mode === "edit" ? "تعديل بيانات وصور المنتج" : "إضافة صنف مخبوزات جديد"}
            </span>
          </h1>
        </div>

        {mode === "edit" && initialProduct && (
          <Link
            href={`/products/${initialProduct.id}`}
            target="_blank"
            className="px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition"
          >
            معاينة صفحة المنتج في المتجر ↗
          </Link>
        )}
      </div>

      {feedback && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-2xl border text-xs font-bold ${
            feedback.kind === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
          }`}
        >
          {feedback.kind === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 5 Product Images */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <ProductImagesUploader
            images={formData.images}
            onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
            maxImages={5}
          />
        </div>

        {/* Basic Info */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4">
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
                التصنيف *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                disabled={loadingCats}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              >
                {loadingCats ? (
                  <option value="">جاري تحميل التصنيفات...</option>
                ) : categories.length === 0 ? (
                  <option value="">لا توجد تصنيفات متاحة</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameAr} ({cat.nameEn})
                    </option>
                  ))
                )}
              </select>
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                الرابط المختصر (Slug)
              </label>
              <input
                type="text"
                dir="ltr"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="taboon-bread (يُنشأ تلقائياً من الـ SKU إذا تُرك فارغاً)"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:border-amber-500 text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              وصف المنتج
            </label>
            <textarea
              rows={3}
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              placeholder="وصف مكونات المنتج ومذاقه وطريقة تقديمه (سيظهر أول كلمتين منه في البطاقة والوصف الكامل في صفحة التفاصيل)..."
              className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              المكونات الطبيعية (تظهر في صفحة تفاصيل المنتج)
            </label>
            <textarea
              rows={2}
              value={formData.ingredientsAr}
              onChange={(e) => setFormData({ ...formData, ingredientsAr: e.target.value })}
              placeholder="مثال: دقيق قمح بلدي، ماء نقي، خميرة طبيعية، زيت زيتون بكر، رشة ملح بحري"
              className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Pricing & Tax */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4">
          <h2 className="text-xs font-bold text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800 pb-2">
            التسعير والوزن والصلاحية (بالدينار الأردني JOD)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                سعر البيع للجمهور (د.أ) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.retailPrice}
                onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                placeholder="1.50"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                تكلفة الإنتاج التقديرية (د.أ)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="0.65"
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
                <option value="قطعة">قطعة</option>
                <option value="كغم">كيلوغرام (كغم)</option>
                <option value="ربطة">ربطة / عبوة</option>
                <option value="درزن">درزن (12 قطعة)</option>
                <option value="قالب">قالب</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                الوزن التقريبي (غرام)
              </label>
              <input
                type="number"
                step="1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="مثال: 250"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                مدة الصلاحية (ساعة)
              </label>
              <input
                type="number"
                step="1"
                value={formData.shelfLifeHours}
                onChange={(e) =>
                  setFormData({ ...formData, shelfLifeHours: e.target.value })
                }
                placeholder="24"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Allergens & Flags */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-5">
          <h2 className="text-xs font-bold text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800 pb-2">
            الوسوم، الحالة ومسببات الحساسية
          </h2>

          <div className="flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
              <span>متاح وظاهر للعملاء</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 accent-amber-600 rounded"
              />
              <span>منتج مميز (يظهر في الرئيسية)</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSeasonal}
                onChange={(e) => setFormData({ ...formData, isSeasonal: e.target.checked })}
                className="w-4 h-4 accent-amber-600 rounded"
              />
              <span>منتج موسمي</span>
            </label>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              يحتوي على مسببات الحساسية التالية:
            </label>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS_LIST.map((a) => {
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
            <span>
              {submitting
                ? "جاري الحفظ..."
                : mode === "edit"
                ? "حفظ التعديلات"
                : "حفظ وإضافة المنتج"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

