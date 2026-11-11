import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return err("يجب تسجيل الدخول أولاً لمشاركة المنشور", 401);
    }

    const { id: postId } = await params;
    const post = await prisma.newsPost.findUnique({
      where: { id: postId },
      select: { id: true, sharesCount: true },
    });

    if (!post) {
      return err("المنشور غير موجود", 404);
    }

    const updated = await prisma.newsPost.update({
      where: { id: postId },
      data: { sharesCount: post.sharesCount + 1 },
      select: { sharesCount: true },
    });

    return ok({ sharesCount: updated.sharesCount });
  } catch (error) {
    console.error("[Share POST Error]:", error);
    return err("فشل تحديث عداد المشاركة", 500);
  }
}
