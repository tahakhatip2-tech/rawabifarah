import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, ok, err, auditLog } from "@/lib/api";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import {
  getSecretarySettings,
  saveSecretarySettings,
  SecretarySettingsSchema,
} from "@/lib/secretary-settings";

function canManageSecretarySettings(role: string, permissions: string[]): boolean {
  if (role === "SUPER_ADMIN" || role === "BUSINESS_OWNER") return true;
  return hasPermission(permissions, role as never, PERMISSIONS.SETTINGS_MANAGE);
}

export const GET = withAuth(async (_req, ctx) => {
  if (!canManageSecretarySettings(ctx.role, ctx.permissions)) {
    return err("لا تملك صلاحية إدارة إعدادات سكرتير المدير", 403);
  }

  const [settings, recentLogs] = await Promise.all([
    getSecretarySettings(),
    prisma.auditLog
      .findMany({
        where: {
          action: { in: ["SECRETARY_COMMAND", "SECRETARY_SETTINGS_UPDATE"] },
        },
        orderBy: { createdAt: "desc" },
        take: 25,
        include: {
          user: {
            select: {
              email: true,
              role: true,
              employee: { select: { nameAr: true } },
            },
          },
        },
      })
      .catch(() => []),
  ]);

  return ok({
    settings,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
    auditLogs: recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      oldData: log.oldData,
      newData: log.newData,
      createdAt: log.createdAt,
      actorName: log.user.employee?.nameAr || log.user.email,
      actorRole: log.user.role,
    })),
  });
});

export const PATCH = withAuth(async (req: NextRequest, ctx) => {
  if (!canManageSecretarySettings(ctx.role, ctx.permissions)) {
    return err("لا تملك صلاحية تعديل إعدادات سكرتير المدير", 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = SecretarySettingsSchema.safeParse(body);
  if (!parsed.success) {
    return err(
      `بيانات الإعدادات غير صالحة: ${parsed.error.issues[0]?.message ?? "تحقق من المدخلات"}`,
      400
    );
  }

  const oldSettings = await getSecretarySettings();
  const saved = await saveSecretarySettings(parsed.data);

  await auditLog({
    userId: ctx.userId,
    action: "SECRETARY_SETTINGS_UPDATE",
    entity: "SystemSetting",
    oldData: {
      enabled: oldSettings.enabled,
      engineMode: oldSettings.engineMode,
      allowCommands: oldSettings.allowCommands,
      allowedRoles: oldSettings.allowedRoles,
    },
    newData: {
      enabled: saved.enabled,
      engineMode: saved.engineMode,
      allowCommands: saved.allowCommands,
      allowedRoles: saved.allowedRoles,
    },
    req,
  });

  return ok({ settings: saved });
});

