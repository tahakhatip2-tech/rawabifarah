import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#f7efe1] text-stone-700 border-t border-amber-900/10 dark:bg-stone-950 dark:text-stone-300 dark:border-stone-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md bg-white dark:bg-stone-900 border border-amber-500/30 p-1 flex items-center justify-center">
                <Image
                  src="/rwabifarah.png"
                  alt="شعار مخابز روابي الفرح"
                  width={48}
                  height={48}
                  className="object-contain w-full h-full"
                  unoptimized
                />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-stone-900 dark:text-white transition-colors">روابي فرح</h3>
                <p className="text-xs text-amber-800 dark:text-stone-400 font-sans">RAWABI AL-FARAH</p>
              </div>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed transition-colors">
              نصنع بحب وشغف أجود أنواع الخبز البلدي، المعجنات الطازجة، الحلويات الشرقية والغربية بمكونات طبيعية ومعايير نظافة وجودة عالمية في عمّان.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-500 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>مخبز مرخص ومطابق لمعايير الغذاء والدواء الأردنية</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-stone-900 dark:text-white tracking-wide border-b border-stone-300 dark:border-stone-800 pb-2 transition-colors">
              روابط سريعة
            </h4>
            <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
              <li>
                <Link href="/menu" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  قائمة المخبوزات والحلويات
                </Link>
              </li>
              <li>
                <Link href="/b2b" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  توريد للمحلات والمطاعم
                </Link>
              </li>
              <li>
                <Link href="/#branches" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  عناوين الفروع ومواعيد العمل
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  لوحة تحكم الإدارة (ERP)
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  بوابة الموظفين والشركاء
                </Link>
              </li>
            </ul>
          </div>

          {/* Branches & Working Hours */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-stone-900 dark:text-white tracking-wide border-b border-stone-300 dark:border-stone-800 pb-2 transition-colors">
              ساعات العمل والفروع
            </h4>
            <ul className="space-y-3 text-xs text-stone-600 dark:text-stone-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <span>الفرع الرئيسي: عمّان — الرابية — شارع الأردن</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p>السبت — الخميس: 07:00 ص — 11:00 م</p>
                  <p className="text-stone-500">الجمعة: 09:00 ص — 11:00 م</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-stone-900 dark:text-white tracking-wide border-b border-stone-300 dark:border-stone-800 pb-2 transition-colors">
              تواصل وطلب سريع
            </h4>
            <ul className="space-y-3 text-xs text-stone-600 dark:text-stone-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span dir="ltr" className="font-mono">+962 7 9900 0001</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                <span dir="ltr" className="font-mono">orders@rawabifarah.com</span>
              </li>
            </ul>

            <div className="pt-2">
              <span className="inline-block px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-amber-900/10 dark:border-stone-800 text-[11px] text-amber-800 dark:text-amber-400 font-bold shadow-sm">
                خدمة التوصيل تغطي كافة مناطق عمّان
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-stone-300/60 dark:border-stone-800/80 text-center text-xs text-stone-500">
          <p>© {new Date().getFullYear()} روابي فرح. جميع الحقوق محفوظة. عمّان — الأردن.</p>
        </div>
      </div>
    </footer>
  );
}
