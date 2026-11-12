import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, ok, err, auditLog } from "@/lib/api";
import {
  attendanceUpsertSchema,
  getDayBounds,
  getMonthBounds,
  isValidObjectId,
} from "@/lib/hr";

function parseTimeOnDay(
  dayStart: Date,
  value: string | null | undefined
): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Support "HH:mm" or "HH:mm:ss"
  const hmMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (hmMatch) {
    const h = Math.min(23, Math.max(0, parseInt(hmMatch[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(hmMatch[2], 10)));
    const s = hmMatch[3] ? Math.min(59, Math.max(0, parseInt(hmMatch[3], 10))) : 0;
    const d = new Date(dayStart);
    d.setHours(h, m, s, 0);
    return d;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const dateParam = searchParams.get("date");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const employeeId = searchParams.get("employeeId");

  let rangeStart: Date;
  let rangeEnd: Date;

  if (monthParam && yearParam) {
    const { monthStart, monthEnd } = getMonthBounds(
      parseInt(yearParam, 10),
      parseInt(monthParam, 10)
    );
    rangeStart = monthStart;
    rangeEnd = monthEnd;
  } else {
    const { dayStart, dayEnd } = getDayBounds(dateParam);
    rangeStart = dayStart;
    rangeEnd = dayEnd;
  }

  const where: Record<string, unknown> = {
    date: { gte: rangeStart, lte: rangeEnd },
  };
  if (employeeId && isValidObjectId(employeeId)) {
    where.employeeId = employeeId;
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          nameAr: true,
          jobTitle: true,
          department: true,
          branch: { select: { id: true, nameAr: true } },
        },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return ok({ records });
}, "attendance:view");

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const raw = await req.json().catch(() => null);
  if (!raw) return err("بيانات الطلب غير صالحة", 400);

  const parsed = attendanceUpsertSchema.safeParse(raw);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message || "بيانات الحضور غير صالحة", 400);
  }

  const data = parsed.data;
  if (!isValidObjectId(data.employeeId)) {
    return err("معرّف الموظف غير صالح", 400);
  }

  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId },
    select: { id: true, nameAr: true },
  });
  if (!employee) {
    return err("الموظف غير موجود", 404);
  }

  const { dayStart, dayEnd } = getDayBounds(data.date);
  const now = new Date();

  const existing = await prisma.attendanceRecord.findFirst({
    where: {
      employeeId: data.employeeId,
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  let saved;
  if (data.action === "CLOCK_IN") {
    if (existing) {
      saved = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          clockIn: existing.clockIn || now,
          status:
            existing.status === "ABSENT" ? "PRESENT" : existing.status,
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });
    } else {
      saved = await prisma.attendanceRecord.create({
        data: {
          employeeId: data.employeeId,
          date: dayStart,
          clockIn: now,
          status: data.status || "PRESENT",
          breakMinutes: data.breakMinutes ?? 0,
          notes: data.notes || null,
        },
      });
    }
  } else if (data.action === "CLOCK_OUT") {
    if (existing) {
      saved = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          clockIn: existing.clockIn || now,
          clockOut: now,
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });
    } else {
      saved = await prisma.attendanceRecord.create({
        data: {
          employeeId: data.employeeId,
          date: dayStart,
          clockIn: now,
          clockOut: now,
          status: "PRESENT",
          breakMinutes: data.breakMinutes ?? 0,
          notes: data.notes || null,
        },
      });
    }
  } else {
    // Manual SET / Update
    const nextClockIn =
      data.clockIn === null
        ? null
        : data.clockIn !== undefined
        ? parseTimeOnDay(dayStart, data.clockIn)
        : existing?.clockIn ?? null;

    const nextClockOut =
      data.clockOut === null
        ? null
        : data.clockOut !== undefined
        ? parseTimeOnDay(dayStart, data.clockOut)
        : existing?.clockOut ?? null;

    const statusValue = data.status || existing?.status || "PRESENT";

    if (existing) {
      saved = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          status: statusValue,
          clockIn: statusValue === "ABSENT" ? null : nextClockIn,
          clockOut: statusValue === "ABSENT" ? null : nextClockOut,
          breakMinutes: data.breakMinutes ?? existing.breakMinutes,
          notes: data.notes !== undefined ? data.notes : existing.notes,
        },
      });
    } else {
      saved = await prisma.attendanceRecord.create({
        data: {
          employeeId: data.employeeId,
          date: dayStart,
          status: statusValue,
          clockIn: statusValue === "ABSENT" ? null : nextClockIn,
          clockOut: statusValue === "ABSENT" ? null : nextClockOut,
          breakMinutes: data.breakMinutes ?? 0,
          notes: data.notes || null,
        },
      });
    }
  }

  await auditLog({
    userId: ctx.userId,
    action: `ATTENDANCE_${data.action}`,
    entity: "AttendanceRecord",
    entityId: saved.id,
    newData: {
      employeeId: data.employeeId,
      status: saved.status,
      clockIn: saved.clockIn,
      clockOut: saved.clockOut,
    },
    req,
  });

  return ok({ record: saved });
}, "attendance:manage");

