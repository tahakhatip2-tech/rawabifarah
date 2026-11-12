"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  Edit3,
  Loader2,
  X,
  Save,
  Calendar,
} from "lucide-react";
import { ATTENDANCE_STATUS_META, calculateWorkedHours } from "@/lib/hr";
import type { HrAttendanceRecord, HrEmployee } from "./types";

interface AttendanceTabProps {
  employees: HrEmployee[];
  onChanged: () => void;
}

export function AttendanceTab({ employees, onChanged }: AttendanceTabProps) {
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [records, setRecords] = useState<HrAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyEmpId, setBusyEmpId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [editModal, setEditModal] = useState<{
    employee: HrEmployee;
    status: "PRESENT" | "LATE" | "ABSENT" | "HALF_DAY";
    clockIn: string;
    clockOut: string;
    breakMinutes: string;
    notes: string;
  } | null>(null);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/hr/attendance?date=${encodeURIComponent(selectedDate)}`
      );
      const json = await res.json();
      if (res.ok && Array.isArray(json?.data?.records)) {
        setRecords(json.data.records);
      }
    } catch {
      // Keep list safe
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const activeEmployees = employees.filter((e) => e.isActive);
  const recordMap = new Map(records.map((r) => [r.employeeId, r]));

  const runQuickAction = async (
    employeeId: string,
    action: "CLOCK_IN" | "CLOCK_OUT" | "SET",
    extra?: Record<string, unknown>
  ) => {
    setBusyEmpId(employeeId);
    setNotice(null);
    try {
      const res = await fetch("/api/hr/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          date: selectedDate,
          action,
          ...extra,
        }),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        await loadAttendance();
        onChanged();
      } else {
        setNotice(json?.error || "تعذر تسجيل الحركة");
      }
    } catch {
      setNotice("تعذر الاتصال بالخادم");
    } finally {
      setBusyEmpId(null);
    }
  };

  const formatHm = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  const openEditModal = (emp: HrEmployee, rec?: HrAttendanceRecord) => {
    setEditModal({
      employee: emp,
      status: (rec?.status as "PRESENT" | "LATE" | "ABSENT" | "HALF_DAY") || "PRESENT",
      clockIn: formatHm(rec?.clockIn) || "08:00",
      clockOut: formatHm(rec?.clockOut) || "16:00",
      breakMinutes: String(rec?.breakMinutes ?? 30),
      notes: rec?.notes || "",
    });
  };

  const saveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    await runQuickAction(editModal.employee.id, "SET", {
      status: editModal.status,
      clockIn: editModal.status === "ABSENT" ? null : editModal.clockIn,
      clockOut: editModal.status === "ABSENT" ? null : editModal.clockOut,
      breakMinutes: parseInt(editModal.breakMinutes, 10) || 0,
      notes: editModal.notes || null,
    });
    setEditModal(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span className="font-bold text-stone-700 dark:text-stone-300">
            تاريخ سجل الدوام:
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-bold transition"
          >
            اليوم
          </button>
        </div>

        <div className="text-xs text-stone-500 flex items-center gap-3">
          <span>
            المسجّلون في هذا اليوم:{" "}
            <strong className="text-stone-900 dark:text-white font-mono">
              {records.length}
            </strong>{" "}
            / {activeEmployees.length}
          </span>
        </div>
      </div>

      {notice && (
        <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs font-bold text-red-700 dark:text-red-300">
          {notice}
        </div>
      )}

      {/* Attendance Table */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-14 flex flex-col items-center justify-center gap-2 text-xs text-stone-500">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            <span>جاري تحميل سجل الحضور...</span>
          </div>
        ) : activeEmployees.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            لا يوجد موظفون نشطون لتسجيل الحضور.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold">
                <tr>
                  <th className="py-3 px-4">الموظف</th>
                  <th className="py-3 px-4">القسم / الفرع</th>
                  <th className="py-3 px-4">وقت الدخول</th>
                  <th className="py-3 px-4">وقت الانصراف</th>
                  <th className="py-3 px-4">ساعات العمل</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">إجراءات الدوام السريع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                {activeEmployees.map((emp) => {
                  const rec = recordMap.get(emp.id);
                  const isBusy = busyEmpId === emp.id;
                  const meta = rec
                    ? ATTENDANCE_STATUS_META[rec.status] || {
                        label: rec.status,
                        badgeClass: "bg-stone-100 text-stone-700",
                      }
                    : null;
                  const worked = rec
                    ? calculateWorkedHours(
                        rec.clockIn,
                        rec.clockOut,
                        rec.breakMinutes
                      )
                    : 0;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/30 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          {emp.nameAr}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {emp.jobTitle}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-stone-600 dark:text-stone-300">
                        <div>{emp.department || "عام"}</div>
                        <div className="text-[10px] text-stone-400">
                          {emp.branch?.nameAr || "الفرع الرئيسي"}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {rec?.clockIn
                          ? new Date(rec.clockIn).toLocaleTimeString("ar-JO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {rec?.clockOut
                          ? new Date(rec.clockOut).toLocaleTimeString("ar-JO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-stone-800 dark:text-stone-200">
                        {worked > 0 ? `${worked} س` : "—"}
                      </td>

                      <td className="py-3 px-4">
                        {meta ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 text-[10px]">
                            لم يُسجَّل
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy || Boolean(rec?.clockIn)}
                            onClick={() => runQuickAction(emp.id, "CLOCK_IN")}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-[11px] flex items-center gap-1 transition"
                            title="تسجيل دخول الآن"
                          >
                            <LogIn className="w-3 h-3" />
                            <span>دخول</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy || Boolean(rec?.clockOut)}
                            onClick={() => runQuickAction(emp.id, "CLOCK_OUT")}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-[11px] flex items-center gap-1 transition"
                            title="تسجيل انصراف الآن"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>خروج</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => openEditModal(emp, rec)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                            title="تعديل وقت الدوام والحالة"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Edit Modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>تعديل دوام: {editModal.employee.nameAr}</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveEditModal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  حالة الدوام
                </label>
                <select
                  value={editModal.status}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      status: e.target.value as
                        | "PRESENT"
                        | "LATE"
                        | "ABSENT"
                        | "HALF_DAY",
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                >
                  <option value="PRESENT">حاضر (PRESENT)</option>
                  <option value="LATE">متأخر (LATE)</option>
                  <option value="HALF_DAY">نصف يوم (HALF_DAY)</option>
                  <option value="ABSENT">غائب (ABSENT)</option>
                </select>
              </div>

              {editModal.status !== "ABSENT" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      وقت الدخول
                    </label>
                    <input
                      type="time"
                      value={editModal.clockIn}
                      onChange={(e) =>
                        setEditModal({ ...editModal, clockIn: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      وقت الانصراف
                    </label>
                    <input
                      type="time"
                      value={editModal.clockOut}
                      onChange={(e) =>
                        setEditModal({ ...editModal, clockOut: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  دقائق الاستراحة
                </label>
                <input
                  type="number"
                  min="0"
                  max="240"
                  value={editModal.breakMinutes}
                  onChange={(e) =>
                    setEditModal({ ...editModal, breakMinutes: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  ملاحظات
                </label>
                <input
                  type="text"
                  value={editModal.notes}
                  onChange={(e) =>
                    setEditModal({ ...editModal, notes: e.target.value })
                  }
                  placeholder="سبب التأخير أو ملاحظة إدارية..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ السجل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

