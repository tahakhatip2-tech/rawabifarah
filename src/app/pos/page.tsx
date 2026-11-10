"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";
import {
  Wheat,
  Search,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  Printer,
  RotateCcw,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

interface POSItem {
  id: string;
  productId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  qty: number;
}

const POS_PRODUCTS = [
  { id: "pos-1", productId: "000000000000000000000030", nameAr: "خبز بلدي (ربطة)", nameEn: "Pita Bread", price: 0.35, category: "bread", code: "101" },
  { id: "pos-2", productId: "000000000000000000000031", nameAr: "كرواسون زبدة", nameEn: "Croissant", price: 1.25, category: "pastries", code: "102" },
  { id: "pos-3", productId: "000000000000000000000032", nameAr: "مناقيش جبنة وزعتر", nameEn: "Cheese Pie", price: 1.5, category: "pies", code: "103" },
  { id: "pos-4", productId: "000000000000000000000033", nameAr: "بقلاوة فستق (1 كغ)", nameEn: "Baklava 1kg", price: 14.5, category: "sweets", code: "104" },
  { id: "pos-5", productId: "000000000000000000000034", nameAr: "معمول تمر (1 كغ)", nameEn: "Date Maamoul", price: 8.5, category: "sweets", code: "105" },
  { id: "pos-6", productId: "000000000000000000000035", nameAr: "باغيت فرنسي", nameEn: "Baguette", price: 0.65, category: "bread", code: "106" },
  { id: "pos-7", productId: "000000000000000000000036", nameAr: "كرواسون شوكولا", nameEn: "Pain Chocolat", price: 1.6, category: "pastries", code: "107" },
  { id: "pos-8", productId: "000000000000000000000037", nameAr: "صفيحة لحمة (درزن)", nameEn: "Meat Sfiha", price: 6.0, category: "pies", code: "108" },
  { id: "pos-9", productId: "000000000000000000000038", nameAr: "قالب كيك فدج", nameEn: "Fudge Cake", price: 18.0, category: "cakes", code: "109" },
  { id: "pos-10", productId: "000000000000000000000039", nameAr: "توست حبوب كاملة", nameEn: "Multigrain Toast", price: 1.2, category: "bread", code: "110" },
  { id: "pos-11", productId: "000000000000000000000040", nameAr: "شاي كرك بالحليب", nameEn: "Karak Tea", price: 0.75, category: "drinks", code: "111" },
  { id: "pos-12", productId: "000000000000000000000041", nameAr: "قهوة أمريكية طازجة", nameEn: "Fresh Brew Coffee", price: 1.0, category: "drinks", code: "112" },
];

const CATEGORIES = [
  { id: "all", name: "الكل" },
  { id: "bread", name: "الخبز" },
  { id: "pastries", name: "المعجنات" },
  { id: "pies", name: "الفطائر" },
  { id: "sweets", name: "الحلويات" },
  { id: "cakes", name: "الكيك" },
  { id: "drinks", name: "المشروبات" },
];

export default function POSTerminalPage() {
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<POSItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [receiptSuccess, setReceiptSuccess] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const addItemToCart = (prod: (typeof POS_PRODUCTS)[0]) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === prod.productId);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].qty += 1;
        return copy;
      } else {
        return [
          ...prev,
          {
            id: prod.id,
            productId: prod.productId,
            nameAr: prod.nameAr,
            nameEn: prod.nameEn,
            price: prod.price,
            qty: 1,
          },
        ];
      }
    });
  };

  const updateItemQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId === productId) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as POSItem[]
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearTicket = () => {
    if (cart.length > 0 && confirm("هل أنت متأكد من تفريغ التذكرة الحالية؟")) {
      setCart([]);
      setDiscountPercent(0);
    }
  };

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Number((taxableAmount * 0.16).toFixed(3));
  const grandTotal = Number((taxableAmount + tax).toFixed(3));

  const tendered = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, tendered - grandTotal);

  const handleCompleteSale = () => {
    setReceiptSuccess({
      ticketNumber: `POS-${Date.now().toString().slice(-6)}`,
      items: [...cart],
      total: grandTotal,
      paid: paymentMethod === "CASH" ? tendered : grandTotal,
      change: paymentMethod === "CASH" ? changeDue : 0,
      method: paymentMethod,
      time: new Date().toLocaleTimeString("ar-JO"),
    });
    setPaymentModalOpen(false);
  };

  const handleStartNewSale = () => {
    setReceiptSuccess(null);
    setCart([]);
    setDiscountPercent(0);
    setAmountTendered("");
  };

  const filteredProducts = POS_PRODUCTS.filter((p) => {
    const matchCat = selectedCat === "all" || p.category === selectedCat;
    const matchSearch =
      p.nameAr.includes(searchQuery) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.includes(searchQuery);
    return matchCat && matchSearch;
  });

  return (
    <div className="h-screen w-screen bg-stone-950 text-stone-100 flex flex-col overflow-hidden select-none font-sans">
      {/* Top POS Navbar */}
      <header className="h-14 bg-stone-900 border-b border-stone-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-stone-900 border border-amber-500/30 p-0.5 flex items-center justify-center">
              <Image
                src="/rwabifarah.png"
                alt="شعار روابي الفرح"
                width={32}
                height={32}
                className="object-contain w-full h-full"
              />
            </div>
            <span className="font-extrabold text-white text-sm">نقطة بيع روابي الفرح (POS)</span>
          </Link>
          <span className="h-4 w-px bg-stone-800" />
          <span className="text-xs text-stone-400">الفرع: <strong className="text-white">الفرع الرئيسي — عمّان</strong></span>
          <span className="h-4 w-px bg-stone-800 hidden sm:block" />
          <span className="text-xs text-stone-400 hidden sm:inline">الكاشير: <strong className="text-amber-400">محمد علي (جلسة #44)</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            جلسة نشطة
          </span>
          <Link
            href="/admin/dashboard"
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition"
          >
            لوحة الإدارة
          </Link>
        </div>
      </header>

      {/* Main Terminal Grid */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Side: Catalog & Search (Cols 8) */}
        <div className="col-span-7 lg:col-span-8 flex flex-col border-l border-stone-800 bg-stone-950 overflow-hidden">
          {/* Search & Category Header */}
          <div className="p-3 border-b border-stone-800 bg-stone-900/60 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="ابحث بالاسم أو الرمز السريع (Barcode / Code)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    selectedCat === cat.id
                      ? "bg-amber-600 text-stone-950 font-black shadow-sm"
                      : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Buttons Grid */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addItemToCart(p)}
                className="p-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/60 active:scale-95 text-right flex flex-col justify-between transition min-h-[95px] shadow-xs hover:bg-stone-850"
              >
                <div>
                  <span className="text-[10px] font-mono text-stone-500 block">#{p.code}</span>
                  <h4 className="font-bold text-xs text-white line-clamp-2 mt-0.5">{p.nameAr}</h4>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-800/80">
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {formatCurrency(p.price)}
                  </span>
                  <div className="w-5 h-5 rounded-md bg-amber-600/20 text-amber-400 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Active Ticket / Bill (Cols 4) */}
        <div className="col-span-5 lg:col-span-4 flex flex-col bg-stone-900 overflow-hidden">
          {/* Ticket Header */}
          <div className="p-3 border-b border-stone-800 flex items-center justify-between shrink-0 bg-stone-900">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-xs text-white">تذكرة البيع الحالية ({cart.length})</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearTicket}
                className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إلغاء</span>
              </button>
            )}
          </div>

          {/* Ticket Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 p-4">
                <ShoppingBag className="w-12 h-12 text-stone-700 mb-2" />
                <p className="text-xs font-bold text-stone-400">التذكرة فارغة</p>
                <p className="text-[11px] text-stone-600 mt-0.5">اضغط على الأصناف لإضافتها إلى الحساب</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-white truncate">{item.nameAr}</h5>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {formatCurrency(item.price)} × {item.qty}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 bg-stone-900 border border-stone-700 rounded-lg p-0.5">
                    <button
                      onClick={() => updateItemQty(item.productId, -1)}
                      className="p-1 text-stone-400 hover:text-white rounded transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-mono font-bold text-white">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateItemQty(item.productId, 1)}
                      className="p-1 text-stone-400 hover:text-white rounded transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-mono font-bold text-xs text-amber-400 w-16 text-left shrink-0">
                    {formatCurrency(item.price * item.qty)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Ticket Bottom Calculations */}
          <div className="p-3 border-t border-stone-800 bg-stone-950 shrink-0 space-y-2">
            {/* Quick Discount Buttons */}
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>الخصم:</span>
              <div className="flex gap-1">
                {[0, 5, 10, 15].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiscountPercent(d)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      discountPercent === d
                        ? "bg-amber-600 text-stone-950"
                        : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-xs text-stone-400">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-mono text-stone-200">{formatCurrency(subtotal)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>الخصم ({discountPercent}%):</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>ضريبة المبيعات (16%):</span>
                <span className="font-mono text-stone-200">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-1.5 border-t border-stone-800">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono text-amber-400 text-base">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Checkout Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                disabled={cart.length === 0}
                onClick={() => {
                  setPaymentMethod("CASH");
                  setAmountTendered(String(grandTotal));
                  setPaymentModalOpen(true);
                }}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Banknote className="w-4 h-4" />
                <span>دفع نقد ({formatCurrency(grandTotal)})</span>
              </button>

              <button
                disabled={cart.length === 0}
                onClick={() => {
                  setPaymentMethod("CARD");
                  setAmountTendered(String(grandTotal));
                  setPaymentModalOpen(true);
                }}
                className="py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <CreditCard className="w-4 h-4" />
                <span>بطاقة POS</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Tender Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                {paymentMethod === "CASH" ? <Banknote className="w-5 h-5 text-emerald-400" /> : <CreditCard className="w-5 h-5 text-sky-400" />}
                <span>تحصيل المبلغ: {paymentMethod === "CASH" ? "نقداً" : "بطاقة بنكية"}</span>
              </h3>
              <button onClick={() => setPaymentModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-center space-y-1">
              <span className="text-xs text-stone-400">المبلغ المطلوب تحصيله:</span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {formatCurrency(grandTotal)}
              </div>
            </div>

            {paymentMethod === "CASH" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">المبلغ المستلم من الزبون (د.أ):</label>
                  <input
                    type="number"
                    step="0.05"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-lg font-mono font-bold text-white text-center focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2">
                  {[5, 10, 20, 50].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmountTendered(String(val))}
                      className="flex-1 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-mono font-bold text-stone-200 border border-stone-700"
                    >
                      {val} د.أ
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-bold">الباقي للزبون:</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {formatCurrency(changeDue)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300 transition"
              >
                إلغاء
              </button>
              <button
                disabled={paymentMethod === "CASH" && tendered < grandTotal}
                onClick={handleCompleteSale}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>إتمام وطباعة الفاتورة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Success Simulation Modal */}
      {receiptSuccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white text-stone-900 rounded-2xl p-6 space-y-4 shadow-2xl font-mono text-xs">
            {/* Bakery thermal receipt layout */}
            <div className="text-center space-y-1 border-b border-dashed border-stone-300 pb-3">
              <h2 className="text-base font-black text-stone-950 font-sans">مخابز روابي الفرح</h2>
              <p className="text-[10px] text-stone-600 font-sans">الفرع الرئيسي — عمّان — الرابية</p>
              <p className="text-[10px] text-stone-500">هاتف: 0799000001 | ض.ع: 12345678</p>
              <div className="flex justify-between text-[10px] text-stone-500 pt-1">
                <span>{receiptSuccess.ticketNumber}</span>
                <span>{receiptSuccess.time}</span>
              </div>
            </div>

            <div className="space-y-1.5 py-1 max-h-48 overflow-y-auto">
              {receiptSuccess.items.map((i: any) => (
                <div key={i.productId} className="flex justify-between">
                  <span className="font-sans font-medium truncate flex-1">{i.nameAr}</span>
                  <span className="text-stone-500 w-8 text-center">{i.qty}×</span>
                  <span className="font-bold">{formatCurrency(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-stone-300 pt-2 space-y-1 text-stone-700">
              <div className="flex justify-between font-bold text-sm text-stone-950">
                <span className="font-sans">الإجمالي المدفوع:</span>
                <span>{formatCurrency(receiptSuccess.total)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="font-sans">طريقة الدفع:</span>
                <span>{receiptSuccess.method === "CASH" ? "نقداً" : "بطاقة فيزا/POS"}</span>
              </div>
              {receiptSuccess.method === "CASH" && (
                <div className="flex justify-between text-[11px]">
                  <span className="font-sans">الباقي:</span>
                  <span>{formatCurrency(receiptSuccess.change)}</span>
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-stone-500 pt-2 font-sans border-t border-dashed border-stone-300">
              شكراً لزيارتكم! نتشرف بخدمتكم دائماً
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-sans font-bold flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
              <button
                onClick={handleStartNewSale}
                className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-sans font-bold flex items-center justify-center gap-1"
              >
                <span>طلب جديد</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
