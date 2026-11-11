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
      return err("يجب تسجيل الدخول أولاً للإعجاب بالمنشور", 401);
    }

    const { id: postId } = await params;
    const visitorKey = `user:${session.user.id}`;

    const post = await prisma.newsPost.findUnique({
      where: { id: postId },
      select: { id: true, likesCount: true },
    });

    if (!post) {
      return err("المنشور غير موجود", 404);
    }

    const existing = await prisma.newsLike.findUnique({
      where: { postId_visitorKey: { postId, visitorKey } },
    });

    if (existing) {
      await prisma.newsLike.delete({ where: { id: existing.id } });
      const newCount = Math.max(0, post.likesCount - 1);
      await prisma.newsPost.update({
        where: { id: postId },
        data: { likesCount: newCount },
      });
      return ok({ liked: false, likesCount: newCount });
    }

    await prisma.newsLike.create({
      data: { postId, visitorKey },
    });
    const newCount = post.likesCount + 1;
    await prisma.newsPost.update({
      where: { id: postId },
      data: { likesCount: newCount },
    });

    return ok({ liked: true, likesCount: newCount });
  } catch (error) {
    console.error("[News Like Error]:", error);
    return err("فشل تسجيل الإعجاب", 500);
  }
}
