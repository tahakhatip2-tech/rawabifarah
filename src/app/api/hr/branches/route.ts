import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, ok } from "@/lib/api";

export const GET = withAuth(async (_req: NextRequest) => {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      businessId: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return ok({ branches });
}, "employees:view");

