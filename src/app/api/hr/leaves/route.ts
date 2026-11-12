import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, ok, err, auditLog } from "@/lib/api";
import {
  calculateLeaveDays,
  isValidObjectId,
  leaveActionSchema,
  leaveCreateSchema,
} from "@/lib/hr";

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");

  const where: Record<string, unknown> = {};
  if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    where.status = status;
  }
  if (employeeId && isValidObjectId(employeeId)) {
    where.employeeId = employeeId;
  }

  const leaves = await prisma.leaveRequest.findMany({
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
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return ok({ leaves });
}, "attendance:view");

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const raw = await req.json().catch(() => null);
  if (!raw) return err("بيانات الطلب غير صالحة", 400);

  const parsed = leaveCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message || "بيانات الإجازة غير صالحة", 400);
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

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const days = calculateLeaveDays(startDate, endDate);

  if (days <= 0) {
    return err("تاريخ نهاية الإجازة يجب أن يكون مساوياً أو بعد تاريخ البداية", 400);
  }

  // Prevent overlapping pending/approved leave requests
  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: data.employeeId,
      status: { in: ["PENDING", "APPROVED"] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });

  if (overlapping) {
    return err("يوجد طلب إجازة متداخل في التواريخ لهذا الموظف", 409);
  }

  const leave = await prisma.leaveRequest.create({
    data: {
      employeeId: data.employeeId,
      type: data.type,
      startDate,
      endDate,
      days,
      reason: data.reason || null,
      status: "PENDING",
    },
    include: {
      employee: {
        select: { id: true, nameAr: true, jobTitle: true, department: true },
      },
    },
  });

  await auditLog({
    userId: ctx.userId,
    action: "CREATE_LEAVE_REQUEST",
    entity: "LeaveRequest",
    entityId: leave.id,
    newData: { employeeId: data.employeeId, type: data.type, days },
    req,
  });

  return ok({ leave }, 201);
}, "attendance:manage");

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  const raw = await req.json().catch(() => null);
  if (!raw) return err("بيانات الطلب غير صالحة", 400);

  const parsed = leaveActionSchema.safeParse(raw);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message || "البيانات غير صالحة", 400);
  }

  const { leaveId, status } = parsed.data;
  if (!isValidObjectId(leaveId)) {
    return err("معرّف طلب الإجازة غير صالح", 400);
  }

  const existing = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
  });
  if (!existing) {
    return err("طلب الإجازة غير موجود", 404);
  }

  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status,
      approvedBy: ctx.userId,
      approvedAt: new Date(),
    },
    include: {
      employee: {
        select: { id: true, nameAr: true, jobTitle: true, department: true },
      },
    },
  });

  await auditLog({
    userId: ctx.userId,
    action: `LEAVE_${status}`,
    entity: "LeaveRequest",
    entityId: leaveId,
    oldData: { status: existing.status },
    newData: { status },
    req,
  });

  return ok({ leave: updated });
}, "attendance:manage");

