import { NextRequest } from "next/server";
import { withAuth, ok, err } from "@/lib/api";
import {
  executeSecretaryAction,
  type PendingActionProposal,
  type SecretaryActionType,
} from "@/lib/secretary-engine";

const VALID_TYPES = new Set<SecretaryActionType>([
  "UPDATE_ORDER_STATUS",
  "UPDATE_PRODUCT_STATUS",
  "UPDATE_PRODUCT_PRICE",
  "ADJUST_INVENTORY",
  "CREATE_NEWS_POST",
  "CREATE_EXPENSE",
]);

export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = (await req.json().catch(() => null)) as {
    proposal?: Partial<PendingActionProposal>;
  } | null;

  const proposal = body?.proposal;
  if (
    !proposal ||
    !proposal.type ||
    !VALID_TYPES.has(proposal.type) ||
    !proposal.payload ||
    typeof proposal.payload !== "object"
  ) {
    return err("بيانات الأمر التنفيذي غير مكتملة أو غير صالحة", 400);
  }

  const result = await executeSecretaryAction(
    proposal as PendingActionProposal,
    ctx
  );

  if (!result.success) {
    return err(result.message, 403);
  }

  return ok(result);
});

