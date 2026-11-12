"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Save,
} from "lucide-react";
import {
  LEAVE_STATUS_META,
  LEAVE_TYPE_META,
  calculateLeaveDays,
} from "@/lib/hr";
import type { HrEmployee, HrLeaveRequest } from "./types";

interface LeavesTabProps {
  employees: HrEmployee[];
  onChanged: () => void;
}

export function LeavesTab({ employees, onChanged }: LeavesTabProps) {
  const [leaves, setLeaves] = useState<HrLeaveRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeEmployees = employees.filter((e) => e.isActive);
  const todayIso = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    employeeId: "",
    type: "ANNUAL",
    startDate: todayIso,
    endDate: todayIso,
    reason: "",
  });

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const qs =
        filterStatus !== "ALL"
          ? `?status=${encodeURIComponent(filterStatus)}`
          : "";
      const res = await fetch(`/api/hr/leaves${qs}`);
      const json = await res.json();
      if (res.ok && Array.isArray(json?.data?.leaves)) {
        setLeaves(json.data.leaves);
      }
    } catch {
      // Keep list safe
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    void loadLeaves();
  }, [loadLeaves]);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/hr/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErrorMsg(json?.error || "تعذر تسجيل طلب الإجازة");
        return;
      }
      setModalOpen(false);
      await loadLeaves();
      onChanged();
    } catch {
      setErrorMsg("تعذر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (
    leaveId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    setBusyId(leaveId);
    try {
      const res = await fetch("/api/hr/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, status }),
      });
      if (res.ok) {
        await loadLeaves();
        onChanged();
      }
    } finally {
      setBusyId(null);
    }
  };

  const computedDays = calculateLeaveDays(form.startDate, form.endDate);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: "ALL", label: "جميع الطلبات" },
            { id: "PENDING", label: "المعلّقة" },
            { id: "APPROVED", label: "المعتمدة" },
            { id: "REJECTED", label: "المرفوضة" },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setFilterStatus(s.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                filterStatus === s.id
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={activeEmployees.length === 0}
          onClick={() => {
            setErrorMsg(null);
            setForm({
              employeeId: activeEmployees[0]?.id || "",
              type: "ANNUAL",
              startDate: todayIso,
              endDate: todayIso,
              reason: "",
            });
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>تقديم طلب إجازة</span>
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-14 flex flex-col items-center justify-center gap-2 text-xs text-stone-500">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            <span>جاري تحميل طلبات الإجازات...</span>
          </div>
        ) : leaves.length === 0 ? (
          <div className="py-14 text-center text-xs text-stone-500">
            لا توجد طلبات إجازة مطابقة حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold">
                <tr>
                  <th className="py-3 px-4">الموظف</th>
                  <th className="py-3 px-4">نوع الإجازة</th>
                  <th className="py-3 px-4">الفترة</th>
                  <th className="py-3 px-4">الأيام</th>
                  <th className="py-3 px-4">السبب</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">القرار الإداري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {leaves.map((l) => {
                  const meta = LEAVE_STATUS_META[l.status];
                  const isBusy = busyId === l.id;
                  return (
                    <tr
                      key={l.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/30 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          {l.employee?.nameAr || "موظف"}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {l.employee?.jobTitle}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-stone-700 dark:text-stone-300">
                        {LEAVE_TYPE_META[l.type] || l.type}
                      </td>

                      <td className="py-3 px-4 font-mono text-stone-600 dark:text-stone-300">
                        {new Date(l.startDate).toLocaleDateString("ar-JO")} →{" "}
                        {new Date(l.endDate).toLocaleDateString("ar-JO")}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold">
                        {l.days} يوم
                      </td>

                      <td className="py-3 px-4 text-stone-500 max-w-[200px] truncate">
                        {l.reason || "—"}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                            meta?.badgeClass || ""
                          }`}
                        >
                          {meta?.label || l.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {l.status === "PENDING" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDecision(l.id, "APPROVED")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>موافقة</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDecision(l.id, "REJECTED")}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>رفض</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-[11px] text-stone-400">
                            {l.approvedAt
                              ? `تم البتّ ${new Date(
                                  l.approvedAt
                                ).toLocaleDateString("ar-JO")}`
                              : "مكتمل"}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Leave Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>تقديم طلب إجازة</span>
              </h4>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs font-bold text-red-700 dark:text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateLeave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  الموظف
                </label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nameAr} — {emp.jobTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  نوع الإجازة
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                >
                  <option value="ANNUAL">إجازة سنوية</option>
                  <option value="SICK">إجازة مرضية</option>
                  <option value="EMERGENCY">إجازة طارئة</option>
                  <option value="UNPAID">إجازة بدون راتب</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    من تاريخ
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    إلى تاريخ
                  </label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 font-bold text-amber-800 dark:text-amber-300">
                المدة المحتسبة: {computedDays > 0 ? `${computedDays} يوم` : "تواريخ غير صالحة"}
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  السبب / الملاحظات
                </label>
                <textarea
                  rows={2}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="تفاصيل طلب الإجازة..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting || computedDays <= 0}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submitting ? "جاري التسجيل..." : "تقديم الطلب"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

