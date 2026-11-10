import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { type UserRole } from "@prisma/client";

export interface ApiContext {
  userId: string;
  role: UserRole;
  permissions: string[];
  branchId: string | null;
  businessId: string | null;
}

type ApiHandler = (
  req: NextRequest,
  context: ApiContext,
  params?: any
) => Promise<NextResponse>;

/**
 * Wrap an API route handler with authentication + optional permission check.
 * Usage:
 *   export const GET = withAuth(handler, "products:view");
 *   export const POST = withAuth(handler); // auth only, no permission check
 */
export function withAuth(handler: ApiHandler, requiredPermission?: Permission) {
  return async (req: NextRequest, { params }: { params?: any } = {}) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId, role, permissions, branchId, businessId } = session.user;

    if (requiredPermission) {
      const allowed = hasPermission(permissions ?? [], role as UserRole, requiredPermission);
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const ctx: ApiContext = {
      userId,
      role: role as UserRole,
      permissions: permissions ?? [],
      branchId: branchId ?? null,
      businessId: businessId ?? null,
    };

    try {
      return await handler(req, ctx, params);
    } catch (error: any) {
      console.error(`[API Error] ${req.method} ${req.nextUrl.pathname}:`, error);

      if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Log an action to the audit log
 */
export async function auditLog(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: object;
  newData?: object;
  req?: NextRequest;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldData: params.oldData as any,
        newData: params.newData as any,
        ipAddress: params.req?.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
        userAgent: params.req?.headers.get("user-agent") ?? undefined,
      },
    });
  } catch (e) {
    // Audit log failure should never break the main operation
    console.error("[AuditLog] Failed to write:", e);
  }
}

/**
 * Standard success response
 */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Standard error response
 */
export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Paginate query helper
 */
export function getPagination(req: NextRequest) {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
