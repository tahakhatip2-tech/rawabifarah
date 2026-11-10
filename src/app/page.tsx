"use client";

import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";
import { useState } from "react";
import {
  Wheat,
  ShoppingBag,
  Sparkles,
  Clock,
  ShieldCheck,
  Truck,
  Building2,
  ChevronLeft,
  CheckCircle2,
  Star,
  MapPin,
  Phone,
} from "lucide-react";

// Featured products for immediate showcase
const FEATURED_PRODUCTS = [
  {
    id: "p1",
    productId: "000000000000000000000030",
    nameAr: "خبز بلدي طازج (ربطة)",
    nameEn: "Fresh Pita Bread",
    category: "الخبز الطازج",
    price: 0.35,
    unit: "ربطة",
    description: "خبز بلدي عربي محضر من دقيق القمح الفاخر مخبوز على الحجر يومياً",
    badge: "الأكثر طلباً",
  },
  {
    id: "p2",
    productId: "000000000000000000000031",
    nameAr: "كرواسون زبدة فرنسي فاخر",
    nameEn: "French Butter Croissant",
    category: "المعجنات",
    price: 1.25,
    unit: "قطعة",
    description: "عجينة مورقة مقرمشة هشة محضرة بزبدة طبيعية نقية 100%",
    badge: "طازج صباحاً",
  },
  {
    id: "p3",
    productId: "000000000000000000000032",
    nameAr: "مناقيش جبنة نابلسية وزعتر",
    nameEn: "Nabulsi Cheese & Zaatar Pie",
    category: "الفطائر",
    price: 1.5,
    unit: "قطعة",
    description: "جبنة نابلسية بلدية مع زعتر بري وزيت زيتون بكر معصور على البارد",
    badge: "مميز",
  },
  {
    id: "p4",
    productId: "000000000000000000000033",
    nameAr: "بقلاوة فستق حلبي ملكية (1 كغ)",
    nameEn: "Royal Pistachio Baklava (1kg)",
    category: "الحلويات الشرقية",
    price: 14.5,
    unit: "كغم",
    description: "رقائق ذهبية مقرمشة محشوة بأجود حبات الفستق الحلبي مع قطر خفيف",
    badge: "فاخر",
  },
  {
    id: "p5",
    productId: "000000000000000000000034",
    nameAr: "معمول تمر بالسمن البلدي (1 كغ)",
    nameEn: "Date Maamoul with Ghee",
    category: "الحلويات",
    price: 8.5,
    unit: "كغم",
    description: "معمول تذوب حباته في الفم معجون بتمر مديني وسمن بلدي أصيل",
    badge: "تقليدي",
  },
  {
    id: "p6",
    productId: "000000000000000000000035",
    nameAr: "خبز باغيت فرنسي مقرمش",
    nameEn: "French Crispy Baguette",
    category: "الخبز الطازج",
    price: 0.65,
    unit: "قطعة",
    description: "قشرة مقرمشة ذهبية وقلب طري بالخميرة الطبيعية العتيقة",
    badge: "يومي",
  },
];

const CATEGORIES = [
  {
    title: "الخبز البلدي والأوروبي",
    desc: "بيتا، طابون، باغيت، وتوست صحي بنخالة القمح",
    icon: "🥖",
    slug: "bread",
  },
  {
    title: "المعجنات والفطائر",
    desc: "كرواسون، مناقيش أفران، وسمبوسك بحشوات طازجة",
    icon: "🥐",
    slug: "pastries",
  },
  {
    title: "الحلويات الشرقية",
    desc: "بقلاوة، معمول، وكنافة بالسمن البلدي",
    icon: "🍯",
    slug: "oriental-sweets",
  },
  {
    title: "الكيك والمناسبات",
    desc: "كيكات فاخرة مخصصة للحفلات والأعياد",
    icon: "🎂",
    slug: "cakes",
  },
  {
    title: "البتيفور والمقرمشات",
    desc: "بسكويت، شابورة، وبتيفور فرنسي للمساء",
    icon: "🍪",
    slug: "cookies",
  },
  {
    title: "تموين المقاهي والمطاعم",
    desc: "أسعار جملة وتوريد يومي مجدول للشركات",
    icon: "📦",
    slug: "wholesale",
  },
];

export default function HomePage() {
  const addItem = useCartStore((state) => state.addItem);
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAddToCart = (product: (typeof FEATURED_PRODUCTS)[0]) => {
    addItem({
      id: product.id,
      productId: product.productId,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      price: product.price,
      unit: product.unit,
      qty: 1,
    });

    setAddedId(product.id);
    setTimeout(() => {
      setAddedId(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-stone-900 dark:bg-stone-950 dark:text-stone-100 flex flex-col font-sans transition-colors duration-300">
      <Navbar />

      {/* ── 1. Hero Section (Majestic Banner with Full Bakery Photo) ── */}
      <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36 border-b border-amber-900/10 dark:border-stone-800 transition-colors">
        {/* Background Image with Dark Atmospheric Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-home.jpg"
            alt="روابي فرح"
            className="w-full h-full object-cover object-center brightness-[0.35] dark:brightness-[0.22] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/75 dark:from-stone-950 dark:via-stone-950/80 dark:to-black/90" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/25 border border-amber-400/35 text-amber-300 text-xs font-bold backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>مخبوز طازج على مدار الساعة في عمّان</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-md">
            رائحة الخَبز الأصيل...
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
              وجودة المذاق الرفيع
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-stone-200 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            في <span className="text-amber-300 font-bold">روابي فرح</span> نجمع بين عراقة التخمير الطبيعي وأحدث التقنيات لنقدم يومياً أشهى المخبوزات، الفطائر الذهبية، والحلويات الفاخرة.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/menu"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-600/35 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 text-center"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>اطلب الآن أونلاين</span>
            </Link>

            <Link
              href="/b2b"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md font-bold text-sm flex items-center justify-center gap-2 transition hover:-translate-y-0.5 shadow-sm text-center"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>توريد المحلات والمطاعم</span>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15 max-w-lg mx-auto">
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-black text-amber-400 font-mono">+50</span>
              <span className="text-[11px] sm:text-xs text-stone-300">صنف مخبوز يومياً</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-black text-amber-400 font-mono">100%</span>
              <span className="text-[11px] sm:text-xs text-stone-300">مكونات طبيعية</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-3xl font-black text-amber-400 font-mono">30 دقيقة</span>
              <span className="text-[11px] sm:text-xs text-stone-300">متوسط التوصيل</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Live Oven Batch Section (أسفل الهيرو مباشرة - بدون حاوية بيضاء) ── */}
      <section className="py-12 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Wheat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">الدفعة الحالية من الفرن</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">مخبوزات طازجة خرجت للتو من أفران الحجر</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
            خَبز طازج الآن
          </span>
        </div>

        {/* Square Product Cards Grid (مباشرة بدون حاوية بيضاء مكررة) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
          {FEATURED_PRODUCTS.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 flex flex-col justify-between shadow-xs hover:shadow-lg dark:hover:shadow-none hover:border-amber-500/50 dark:hover:border-amber-500/40 transition group"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/15">
                    {item.badge}
                  </span>
                  <span className="text-[10px] sm:text-xs text-stone-400 font-sans">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-xs sm:text-base font-extrabold text-stone-900 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  {item.nameAr}
                </h3>
                <p className="text-[10px] sm:text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs sm:text-base font-black text-amber-700 dark:text-amber-400 font-mono" dir="ltr">
                  {formatCurrency(item.price)}
                </span>
                <button
                  onClick={() => handleAddToCart(item)}
                  className={`w-full sm:w-auto px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    addedId === item.id
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-600 hover:bg-amber-500 text-white"
                  }`}
                >
                  {addedId === item.id ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /><span>أضيف</span></>
                  ) : (
                    <><ShoppingBag className="w-3.5 h-3.5" /><span>أضف للسلة</span></>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 hover:text-amber-600 transition"
          >
            <span>عرض كافة منتجات المتجر وأسعارها (+50 صنف)</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 bg-[#f8f2e7]/70 dark:bg-stone-900/40 border-y border-stone-200 dark:border-stone-800/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white transition-colors">تصنيفات منتجاتنا</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 transition-colors">
              تصفح التشكيلة الغنية من المخبوزات والحلويات المحضرة يومياً
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat, idx) => (
              <Link
                key={idx}
                href="/menu"
                className="group p-6 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200/90 dark:border-stone-800 hover:border-amber-500/50 hover:shadow-lg dark:hover:bg-stone-900 transition transform hover:-translate-y-1 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
                  {cat.icon}
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  {cat.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">{cat.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-500 group-hover:text-amber-500">
                  <span>تصفح الأصناف</span>
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Shelf */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
              مختارات اليوم
            </span>
            <h2 className="text-3xl font-black text-stone-900 dark:text-white mt-1 transition-colors">أشهر مخبوزات روابي فرح</h2>
          </div>
          <Link
            href="/menu"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 transition-colors"
          >
            <span>عرض كافة المنتجات والأسعار</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {FEATURED_PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              className="rounded-2xl bg-white dark:bg-stone-900/70 border border-stone-200/90 dark:border-stone-800/80 p-3 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-md dark:hover:shadow-none hover:border-amber-500/50 dark:hover:border-amber-500/40 transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-stone-500 dark:text-stone-400 truncate max-w-[55%]">
                    {prod.category}
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[9px] sm:text-[10px] font-bold">
                    {prod.badge}
                  </span>
                </div>
                <h3 className="font-extrabold text-xs sm:text-base text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition line-clamp-1">
                  {prod.nameAr}
                </h3>
                <p className="text-[10px] sm:text-xs text-stone-600 dark:text-stone-400 mt-1 sm:mt-2 line-clamp-2 leading-relaxed">
                  {prod.description}
                </p>
              </div>

              <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] sm:text-[10px] text-stone-500 hidden sm:block">السعر شامل الضريبة</span>
                  <span className="text-xs sm:text-lg font-black text-amber-700 dark:text-amber-400 font-mono">
                    {formatCurrency(prod.price)}
                  </span>
                </div>

                <button
                  onClick={() => handleAddToCart(prod)}
                  className={`w-full sm:w-auto px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition ${
                    addedId === prod.id
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-600 hover:bg-amber-500 text-white"
                  }`}
                >
                  {addedId === prod.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>أضيف!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>أضف</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-16 bg-[#f8f2e7]/70 dark:bg-stone-900/50 border-t border-stone-200 dark:border-stone-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-14">
            <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white transition-colors">لماذا روابي فرح؟</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 transition-colors">
              نلتزم بأعلى معايير الحرفية الغذائية لتقديم طعم لا يُنسى
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-950/60 border border-stone-200/90 dark:border-stone-800 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 mx-auto flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Wheat className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 dark:text-white text-base">دقيق ومكونات نقية</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                نستخدم دقيق القمح المختار بدون محسنات كيميائية ضارة، وزبدة طبيعية نقية.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-950/60 border border-stone-200/90 dark:border-stone-800 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 mx-auto flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 dark:text-white text-base">خَبز طازج 24/7</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                أفراننا تعمل على مدار اليوم لتصلكم المخبوزات ساخنة فور خروجها من الفرن.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-950/60 border border-stone-200/90 dark:border-stone-800 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 mx-auto flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 dark:text-white text-base">أسطول توصيل سريع</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                سيارات توصيل مجهزة حرارياً للحفاظ على قرمشة وطراوة المخبوزات لكافة مناطق عمّان.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-950/60 border border-stone-200/90 dark:border-stone-800 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 mx-auto flex items-center justify-center text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 dark:text-white text-base">سلامة وجودة الغذاء</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                فريق ضبط جودة متخصص ورقابة صارمة على معايير النظافة والتعقيم في كل مرحلة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* B2B Callout */}
      <section className="py-16 bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 text-white border-y border-amber-700/40 shadow-inner">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
            <Building2 className="w-4 h-4" />
            <span>بوابة التوريد التجاري B2B</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white">
            شريك التوريد الموثوق لمقهاك وفندقك في الأردن
          </h2>

          <p className="text-amber-100/90 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            نقدم حلول توريد يومية مجدولة للكرواسون، خبز البرغر والبريوش، والحلويات بأسعار جملة منافسة، مع كشوفات حساب دقيقة وفواتير ضريبية نظامية.
          </p>

          <div className="pt-2">
            <Link
              href="/b2b"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white hover:bg-amber-50 text-amber-950 font-extrabold text-sm shadow-xl transition hover:-translate-y-0.5"
            >
              <span>طلب حساب تاجر وعروض أسعار الجملة</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Branches Section */}
      <section id="branches" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white transition-colors">فروعنا ومراكز الخدمة</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 transition-colors">يسعدنا استقبالكم في فروعنا في عمّان</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Branch 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-stone-900 dark:text-white">الفرع الرئيسي — الرابية</h3>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                مفتوح الآن
              </span>
            </div>
            <div className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span>عمّان — الرابية — بجانب مجمع البنوك</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span>يومياً: 07:00 صباحاً — 11:00 مساءً</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span dir="ltr" className="font-mono">+962 7 9900 0001</span>
              </p>
            </div>
          </div>

          {/* Branch 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200/90 dark:border-stone-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-stone-900 dark:text-white">فرع غرب عمّان — الدوار السابع</h3>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                مفتوح الآن
              </span>
            </div>
            <div className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span>عمّان — الدوار السابع — شارع المطار</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span>يومياً: 07:00 صباحاً — 12:00 منتصف الليل</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span dir="ltr" className="font-mono">+962 7 9900 0002</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
