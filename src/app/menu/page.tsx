"use client";

import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/currency";
import { useState, useMemo } from "react";
import { Search, ShoppingBag, CheckCircle2, Filter, Sparkles } from "lucide-react";

const MENU_ITEMS = [
  {
    id: "m1",
    productId: "000000000000000000000030",
    nameAr: "خبز بلدي طازج (ربطة)",
    nameEn: "Fresh Pita Bread",
    category: "bread",
    categoryName: "الخبز الطازج",
    price: 0.35,
    unit: "ربطة",
    description: "خبز بلدي عربي محضر من دقيق القمح الفاخر مخبوز على الحجر يومياً",
    dietary: ["نباتي", "طبيعي 100%"],
  },
  {
    id: "m2",
    productId: "000000000000000000000031",
    nameAr: "كرواسون زبدة فرنسي فاخر",
    nameEn: "French Butter Croissant",
    category: "pastries",
    categoryName: "المعجنات",
    price: 1.25,
    unit: "قطعة",
    description: "عجينة مورقة مقرمشة هشة محضرة بزبدة طبيعية نقية 100%",
    dietary: ["زبدة نقية"],
  },
  {
    id: "m3",
    productId: "000000000000000000000032",
    nameAr: "مناقيش جبنة نابلسية وزعتر",
    nameEn: "Nabulsi Cheese & Zaatar Pie",
    category: "pies",
    categoryName: "الفطائر",
    price: 1.5,
    unit: "قطعة",
    description: "جبنة نابلسية بلدية مع زعتر بري وزيت زيتون بكر معصور على البارد",
    dietary: ["محلي أصيل"],
  },
  {
    id: "m4",
    productId: "000000000000000000000033",
    nameAr: "بقلاوة فستق حلبي ملكية (1 كغ)",
    nameEn: "Royal Pistachio Baklava (1kg)",
    category: "sweets",
    categoryName: "الحلويات الشرقية",
    price: 14.5,
    unit: "كغم",
    description: "رقائق ذهبية مقرمشة محشوة بأجود حبات الفستق الحلبي مع قطر خفيف",
    dietary: ["فستق ممتاز"],
  },
  {
    id: "m5",
    productId: "000000000000000000000034",
    nameAr: "معمول تمر بالسمن البلدي (1 كغ)",
    nameEn: "Date Maamoul with Ghee",
    category: "sweets",
    categoryName: "الحلويات الشرقية",
    price: 8.5,
    unit: "كغم",
    description: "معمول تذوب حباته في الفم معجون بتمر مديني وسمن بلدي أصيل",
    dietary: ["سمن بلدي"],
  },
  {
    id: "m6",
    productId: "000000000000000000000035",
    nameAr: "خبز باغيت فرنسي مقرمش",
    nameEn: "French Crispy Baguette",
    category: "bread",
    categoryName: "الخبز الطازج",
    price: 0.65,
    unit: "قطعة",
    description: "قشرة مقرمشة ذهبية وقلب طري بالخميرة الطبيعية العتيقة",
    dietary: ["خميرة طبيعية"],
  },
  {
    id: "m7",
    productId: "000000000000000000000036",
    nameAr: "كرواسون شوكولاتة بلجيكية (بين أو شوكولا)",
    nameEn: "Pain au Chocolat",
    category: "pastries",
    categoryName: "المعجنات",
    price: 1.6,
    unit: "قطعة",
    description: "كرواسون فرنسي محشو بقضبان الشوكولاتة البلجيكية الداكنة",
    dietary: ["شوكولاتة بلجيكية"],
  },
  {
    id: "m8",
    productId: "000000000000000000000037",
    nameAr: "صفيحة لحمة بلدية بدبس الرمان (درزن)",
    nameEn: "Meat Sfiha with Pomegranate (Dozen)",
    category: "pies",
    categoryName: "الفطائر",
    price: 6.0,
    unit: "درزن",
    description: "لحمة خروف بلدي طازجة متبلة بالصنوبر ودبس الرمان الطبيعي",
    dietary: ["لحم بلدي"],
  },
  {
    id: "m9",
    productId: "000000000000000000000038",
    nameAr: "كيكة شوكولاتة فدج فاخرة (8 أشخاص)",
    nameEn: "Chocolate Fudge Cake",
    category: "cakes",
    categoryName: "الكيك والمناسبات",
    price: 18.0,
    unit: "قالب",
    description: "طبقات من كيك الشوكولاتة الغني مغطاة بغناش الكاكاو الإكوادوري",
    dietary: ["مناسبات"],
  },
  {
    id: "m10",
    productId: "000000000000000000000039",
    nameAr: "توست بر كامل صحي بالحبوب",
    nameEn: "Multigrain Wholewheat Toast",
    category: "bread",
    categoryName: "الخبز الطازج",
    price: 1.2,
    unit: "كيس",
    description: "خبز توست غني بالألياف مع بذور الكتان، الشيا، والشوفان الكامل",
    dietary: ["صحي", "ألياف عالية"],
  },
];

const CATEGORY_TABS = [
  { id: "all", label: "جميع الأصناف" },
  { id: "bread", label: "الخبز الطازج" },
  { id: "pastries", label: "المعجنات" },
  { id: "pies", label: "الفطائر والصفيحة" },
  { id: "sweets", label: "الحلويات الشرقية" },
  { id: "cakes", label: "الكيك والمناسبات" },
];

export default function MenuPage() {
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);

  const addItem = useCartStore((state) => state.addItem);

  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const matchCat = selectedCat === "all" || item.category === selectedCat;
      const matchSearch =
        item.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCat, searchQuery]);

  const handleAddToCart = (item: (typeof MENU_ITEMS)[0]) => {
    addItem({
      id: item.id,
      productId: item.productId,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      price: item.price,
      unit: item.unit,
      qty: 1,
    });

    setAddedId(item.id);
    setTimeout(() => {
      setAddedId(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-stone-900 dark:bg-stone-950 dark:text-stone-100 flex flex-col font-sans transition-colors duration-300">
      <Navbar />

      {/* Menu Header with Expressive Hero Image */}
      <section className="relative overflow-hidden py-14 sm:py-20 border-b border-amber-900/10 dark:border-stone-800 transition-colors">
        {/* Background Image with Dark Vignette Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-menu.jpg"
            alt="تشكيلة منتجات روابي الفرح"
            className="w-full h-full object-cover object-center brightness-[0.38] dark:brightness-[0.25] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60 dark:from-stone-950 dark:via-stone-950/70 dark:to-black/80" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3.5 relative z-10 text-white">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/25 backdrop-blur-md text-amber-300 text-xs font-bold border border-amber-400/30 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>قائمة المنتجات اليومية الطازجة</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
            قائمة مخبوزات وحلويات روابي فرح
          </h1>
          <p className="text-sm sm:text-base text-stone-200 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            مخبوزات طازجة محضرة يومياً بأيدي أمهر الخبازين — اطلب أونلاين واستلم من الفرع أو عبر التوصيل السريع لكافة مناطق عمّان
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="sticky top-[70px] z-30 bg-[#fdfaf5]/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 py-4 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCat(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCat === tab.id
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
                      : "bg-stone-200/70 hover:bg-stone-200 text-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث عن مخبوز أو حلوى..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-amber-500 transition shadow-inner dark:shadow-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Menu Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-stone-500 dark:text-stone-400">
            تم العثور على <strong className="text-stone-900 dark:text-white font-mono">{filteredItems.length}</strong> صنف
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-20 text-stone-500 space-y-3">
            <Filter className="w-12 h-12 mx-auto text-stone-400 dark:text-stone-600" />
            <p className="text-base font-bold text-stone-700 dark:text-stone-400">لم يتم العثور على نتائج</p>
            <p className="text-xs">جرب البحث بكلمة أخرى أو قم بإلغاء الفلاتر</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200/90 dark:border-stone-800/80 p-3 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-md dark:hover:shadow-none hover:border-amber-500/50 dark:hover:border-amber-500/40 transition group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-500 truncate max-w-[55%]">
                      {item.categoryName}
                    </span>
                    <div className="flex gap-1">
                      {item.dietary.slice(0, 1).map((tag, i) => (
                        <span
                          key={i}
                          className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:bg-stone-800 dark:text-stone-400 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="font-bold text-xs sm:text-base text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition line-clamp-1">
                    {item.nameAr}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-stone-600 dark:text-stone-400 mt-1 sm:mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-stone-500 hidden sm:block">
                      {formatCurrency(item.price)} / {item.unit}
                    </span>
                    <span className="text-xs sm:text-base font-black text-amber-700 dark:text-amber-400 font-mono">
                      {formatCurrency(item.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className={`w-full sm:w-auto px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition ${
                      addedId === item.id
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-600 hover:bg-amber-500 text-white"
                    }`}
                  >
                    {addedId === item.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>أضيف!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>أضف للسلة</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
