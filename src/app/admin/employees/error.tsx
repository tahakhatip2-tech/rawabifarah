"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminEmployeesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-red-200 dark:border-red-900/60 text-center space-y-3 max-w-lg mx-auto my-10">
      <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 mx-auto flex items-center justify-center">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="font-black text-base text-stone-900 dark:text-stone-100">
        حدث خطأ غير متوقع في صفحة الموظفين
      </h2>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        لم تتأثر أي بيانات. يمكنك إعادة تحميل القسم بأمان عبر الزر أدناه.
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-2 transition"
      >
        <RefreshCw className="w-4 h-4" />
        <span>إعادة المحاولة</span>
      </button>
    </div>
  );
}

