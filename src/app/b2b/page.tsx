"use client";

import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { useState } from "react";
import { Building2, CheckCircle2, ShieldCheck, Truck, Receipt, Send } from "lucide-react";

export default function B2BPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "CAFE",
    contactPerson: "",
    phone: "",
    email: "",
    city: "عمّان",
    dailyVolume: "50-100",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-stone-900 dark:bg-stone-950 dark:text-stone-100 flex flex-col font-sans transition-colors duration-300">
      <Navbar />

      {/* Header with Expressive B2B Hero Image */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-amber-900/10 dark:border-stone-800 transition-colors">
        {/* Background Image with Dark Professional Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-b2b.jpg"
            alt="توريد المخبوزات للمحلات والمطاعم"
            className="w-full h-full object-cover object-center brightness-[0.32] dark:brightness-[0.22] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/60 dark:from-stone-950 dark:via-stone-950/75 dark:to-black/85" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center space-y-4 relative z-10 text-white">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/25 backdrop-blur-md text-amber-300 text-xs font-bold border border-amber-400/30 shadow-sm">
            <Building2 className="w-4 h-4 text-amber-300" />
            <span>بوابة التوريد للمحلات والمطاعم والشركات</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
            شريك التوريد الحصري لمقهاك ومطعمك
          </h1>
          <p className="text-sm sm:text-base text-stone-200 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            توريد يومي فجر كل صباح بأعلى معايير النظافة والاتساق في المذاق، مع كشوفات حساب مرنة وفواتير ضريبية لقطاع الأعمال في عمّان.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-b border-stone-200 dark:border-stone-800 bg-[#f8f2e7]/70 dark:bg-stone-900/30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 space-y-2 shadow-sm">
              <Truck className="w-8 h-8 text-amber-600 dark:text-amber-500" />
              <h3 className="font-bold text-stone-900 dark:text-white text-base">تسليم مبكر قبل ساعات العمل</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                سيارات التوريد تصلك يومياً بين الساعة 5:30 و 7:00 صباحاً لتكون واجهات مقهاك جاهزة لاستقبال زبائنك.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 space-y-2 shadow-sm">
              <Receipt className="w-8 h-8 text-amber-600 dark:text-amber-500" />
              <h3 className="font-bold text-stone-900 dark:text-white text-base">أسعار جملة وفواتير ضريبية</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                خصومات خاصة على الكميات، حساب ائتماني أسبوعي أو شهري، وفواتير ضريبية متوافقة مع دائرة ضريبة الدخل.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 space-y-2 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-amber-600 dark:text-amber-500" />
              <h3 className="font-bold text-stone-900 dark:text-white text-base">ثبات لا يتغير في الجودة</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                خطوط إنتاج متطورة ومقادير محسوبة بالحبة تضمن لك تقديم نفس التجربة الفاخرة لزبائنك كل يوم.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 flex-1 max-w-3xl mx-auto px-4 w-full">
        <div className="rounded-3xl bg-white dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800 p-8 shadow-xl dark:shadow-2xl transition">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-stone-900 dark:text-white">تم استلام طلبكم بنجاح!</h3>
              <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
                شكراً لاهتمامكم بالشراكة مع روابي فرح. سيتواصل معكم مسؤول مبيعات الشركات خلال ساعات لتزويدكم بعينات مجانية وعرض الأسعار.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">طلب عينات مجانية وفتح حساب تجاري</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  املأ النموذج وسنقوم بالتواصل معك لترتيب تذوق عينات مجانية لمقهاك أو فندقك.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    اسم المنشأة / المقهى / الفندق *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="مثال: مقهى الأوركيد"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    نوع النشاط *
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="CAFE">مقهى وكوفي شوب</option>
                    <option value="RESTAURANT">مطعم / برغر</option>
                    <option value="HOTEL">فندق أو منتجع</option>
                    <option value="SUPERMARKET">سوبرماركت / بقالة</option>
                    <option value="CATERING">إعاشة ومناسبات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    اسم الشخص المسؤول *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="الاسم الثلاثي"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    رقم الهاتف / واتساب *
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+962 7 xxxxxxxx"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-amber-500 text-right transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="procurement@company.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-amber-500 text-right transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    الاستهلاك اليومي التقديري (قطع)
                  </label>
                  <select
                    value={formData.dailyVolume}
                    onChange={(e) => setFormData({ ...formData, dailyVolume: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="20-50">20 — 50 قطعة يومياً</option>
                    <option value="50-100">50 — 100 قطعة يومياً</option>
                    <option value="100-300">100 — 300 قطعة يومياً</option>
                    <option value="300+">+300 قطعة يومياً (كميات كبرى)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  أصناف المخبوزات المطلوبة وملاحظات إضافية
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="مثال: كرواسون زبدة، بريوش برغر، كوكيز، ميني تارت..."
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-xl shadow-amber-600/20 flex items-center justify-center gap-2 transition hover:-translate-y-0.5"
              >
                <Send className="w-4 h-4" />
                <span>إرسال طلب فتح حساب تجاري وتجربة العينات</span>
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
