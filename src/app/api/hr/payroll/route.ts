import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, ok, err, auditLog } from "@/lib/api";
import {
  computePayrollBreakdown,
  getMonthBounds,
  isValidObjectId,
  payrollActionSchema,
} from "@/lib/hr";

export const GET = withAuth(async (req: NextRequest) => {
  const now = new Date();
  const month = Math.min(
    12,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("month") || String(now.getUTCMonth() + 1), 10) || now.getUTCMonth() + 1)
  );
  const year = Math.min(
    2100,
    Math.max(2020, parseInt(req.nextUrl.searchParams.get("year") || String(now.getUTCFullYear()), 10) || now.getUTCFullYear())
  );

  const records = await prisma.payrollRecord.findMany({
    where: { month, year },
    include: {
      employee: {
        select: {
          id: true,
          nameAr: true,
          jobTitle: true,
          department: true,
          baseSalary: true,
          branch: { select: { id: true, nameAr: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const totals = records.reduce(
    (acc, r) => {
      acc.baseTotal += r.baseSalary;
      acc.overtimeTotal += r.overtimePay;
      acc.bonusTotal += r.bonuses;
      acc.deductionTotal += r.deductions;
      acc.netTotal += r.netSalary;
      return acc;
    },
    { baseTotal: 0, overtimeTotal: 0, bonusTotal: 0, deductionTotal: 0, netTotal: 0 }
  );

  return ok({ month, year, records, totals });
}, "payroll:view");

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const raw = await req.json().catch(() => null);
  if (!raw) return err("بيانات الطلب غير صالحة", 400);

  const parsed = payrollActionSchema.safeParse(raw);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message || "بيانات الرواتب غير صالحة", 400);
  }

  const data = parsed.data;
  const { month, year } = data;
  const { monthStart, monthEnd } = getMonthBounds(year, month);

  if (data.action === "GENERATE") {
    const [activeEmployees, attendance, approvedUnpaidLeaves, existingRecords] =
      await Promise.all([
        prisma.employee.findMany({
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.attendanceRecord.findMany({
          where: { date: { gte: monthStart, lte: monthEnd } },
        }),
        prisma.leaveRequest.findMany({
          where: {
            status: "APPROVED",
            type: "UNPAID",
            startDate: { lte: monthEnd },
            endDate: { gte: monthStart },
          },
        }),
        prisma.payrollRecord.findMany({ where: { month, year } }),
      ]);

    const existingMap = new Map(existingRecords.map((r) => [r.employeeId, r]));
    const results = [];

    for (const emp of activeEmployees) {
      const existing = existingMap.get(emp.id);
      if (existing && existing.status === "PAID") {
        results.push(existing);
        continue;
      }

      const empAtt = attendance.filter((a) => a.employeeId === emp.id);
      const workedDays = empAtt.filter(
        (a) => a.status === "PRESENT" || a.status === "LATE"
      ).length;
      const absentDays = empAtt.filter((a) => a.status === "ABSENT").length;
      const halfDays = empAtt.filter((a) => a.status === "HALF_DAY").length;

      const unpaidLeaveDays = approvedUnpaidLeaves
        .filter((l) => l.employeeId === emp.id)
        .reduce((sum, l) => sum + (Number(l.days) || 0), 0);

      const overtimePay = existing?.overtimePay ?? 0;
      const bonuses = existing?.bonuses ?? 0;

      const calc = computePayrollBreakdown({
        baseSalary: emp.baseSalary,
        absentDays,
        unpaidLeaveDays,
        halfDays,
        overtimePay,
        bonuses,
      });

      const saved = existing
        ? await prisma.payrollRecord.update({
            where: { id: existing.id },
            data: {
              baseSalary: emp.baseSalary,
              deductions: calc.deductions,
              netSalary: calc.netSalary,
              workedDays,
              absentDays,
            },
          })
        : await prisma.payrollRecord.create({
            data: {
              employeeId: emp.id,
              month,
              year,
              baseSalary: emp.baseSalary,
              overtimePay,
              bonuses,
              deductions: calc.deductions,
              netSalary: calc.netSalary,
              workedDays,
              absentDays,
              lateMinutes: 0,
              status: "DRAFT",
            },
          });

      results.push(saved);
    }

    await auditLog({
      userId: ctx.userId,
      action: "GENERATE_PAYROLL",
      entity: "PayrollRecord",
      newData: { month, year, count: results.length },
      req,
    });

    return ok({ generatedCount: results.length });
  }

  if (data.action === "UPDATE_SLIP") {
    if (!isValidObjectId(data.recordId)) {
      return err("معرّف قسيمة الراتب غير صالح", 400);
    }
    const existing = await prisma.payrollRecord.findUnique({
      where: { id: data.recordId! },
    });
    if (!existing) {
      return err("قسيمة الراتب غير موجودة", 404);
    }
    if (existing.status === "PAID") {
      return err("لا يمكن تعديل قسيمة راتب تم صرفها بالفعل", 400);
    }

    const overtimePay =
      data.overtimePay !== undefined ? data.overtimePay : existing.overtimePay;
    const bonuses = data.bonuses !== undefined ? data.bonuses : existing.bonuses;
    const deductions =
      data.deductions !== undefined ? data.deductions : existing.deductions;

    const calc = computePayrollBreakdown({
      baseSalary: existing.baseSalary,
      absentDays: 0,
      overtimePay,
      bonuses,
      manualDeductions: deductions,
    });

    const updated = await prisma.payrollRecord.update({
      where: { id: existing.id },
      data: {
        overtimePay: calc.overtimePay,
        bonuses: calc.bonuses,
        deductions: calc.deductions,
        netSalary: calc.netSalary,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      },
    });

    await auditLog({
      userId: ctx.userId,
      action: "UPDATE_PAYROLL_SLIP",
      entity: "PayrollRecord",
      entityId: updated.id,
      newData: {
        overtimePay: updated.overtimePay,
        bonuses: updated.bonuses,
        deductions: updated.deductions,
        netSalary: updated.netSalary,
      },
      req,
    });

    return ok({ record: updated });
  }

  if (data.action === "APPROVE") {
    const updated = await prisma.payrollRecord.updateMany({
      where: { month, year, status: "DRAFT" },
      data: { status: "APPROVED", approvedBy: ctx.userId },
    });

    await auditLog({
      userId: ctx.userId,
      action: "APPROVE_PAYROLL",
      entity: "PayrollRecord",
      newData: { month, year, count: updated.count },
      req,
    });

    return ok({ approvedCount: updated.count });
  }

  // MARK_PAID
  const unpaidRecords = await prisma.payrollRecord.findMany({
    where: { month, year, status: { in: ["DRAFT", "APPROVED"] } },
    include: { employee: { select: { branchId: true } } },
  });

  if (unpaidRecords.length === 0) {
    return err("لا توجد رواتب معلّقة للصرف في هذا الشهر", 400);
  }

  const paidAt = new Date();
  await prisma.payrollRecord.updateMany({
    where: { month, year, status: { in: ["DRAFT", "APPROVED"] } },
    data: {
      status: "PAID",
      paidAt,
      approvedBy: ctx.userId,
    },
  });

  const totalDisbursed = unpaidRecords.reduce((s, r) => s + r.netSalary, 0);
  const targetBranchId =
    unpaidRecords[0]?.employee?.branchId ||
    ctx.branchId ||
    (await prisma.branch.findFirst({ where: { isActive: true } }))?.id;

  if (data.recordExpense && targetBranchId && totalDisbursed > 0) {
    await prisma.expense.create({
      data: {
        branchId: targetBranchId,
        category: "SALARIES",
        amount: Number(totalDisbursed.toFixed(3)),
        description: `رواتب الموظفين لشهر ${month}/${year} (${unpaidRecords.length} موظفين)`,
        date: paidAt,
        recordedBy: ctx.userId,
        approvedBy: ctx.userId,
      },
    });
  }

  await auditLog({
    userId: ctx.userId,
    action: "PAY_PAYROLL",
    entity: "PayrollRecord",
    newData: {
      month,
      year,
      paidCount: unpaidRecords.length,
      totalDisbursed,
    },
    req,
  });

  return ok({ paidCount: unpaidRecords.length, totalDisbursed });
}, "payroll:view");

