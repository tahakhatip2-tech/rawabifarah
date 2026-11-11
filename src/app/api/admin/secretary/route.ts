import { NextRequest } from "next/server";
import { withAuth, ok, err } from "@/lib/api";
import {
  getExecutivePulse,
  processSecretaryQuery,
} from "@/lib/secretary-engine";
import {
  getSecretarySettings,
  isRoleAllowedForSecretary,
} from "@/lib/secretary-settings";

export const GET = withAuth(async (_req, ctx) => {
  const settings = await getSecretarySettings();
  const allowed = isRoleAllowedForSecretary(ctx.role, settings);

  if (!allowed || !settings.enabled) {
    return ok({
      enabled: settings.enabled,
      allowed,
      settings: {
        displayName: settings.displayName,
        subtitle: settings.subtitle,
      },
    });
  }

  const pulse = await getExecutivePulse(settings);

  return ok({
    enabled: settings.enabled,
    allowed: true,
    settings: {
      displayName: settings.displayName,
      subtitle: settings.subtitle,
      autoBriefingOnOpen: settings.autoBriefingOnOpen,
      allowCommands: settings.allowCommands,
      quickPrompts: settings.quickPrompts,
    },
    pulse,
  });
});

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = (await req.json().catch(() => null)) as {
    message?: unknown;
    history?: unknown;
  } | null;

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return err("يرجى كتابة سؤالك أو أمرك أولاً", 400);
  }
  if (message.length > 1200) {
    return err("النص طويل جداً، يرجى اختصاره لأقل من 1200 حرف", 400);
  }

  const history = Array.isArray(body?.history)
    ? body.history
        .filter(
          (m): m is { role: "user" | "assistant"; content: string } =>
            Boolean(m) &&
            typeof m === "object" &&
            ((m as { role?: unknown }).role === "user" ||
              (m as { role?: unknown }).role === "assistant") &&
            typeof (m as { content?: unknown }).content === "string"
        )
        .slice(-8)
    : [];

  const result = await processSecretaryQuery({ message, history, ctx });
  return ok(result);
});

