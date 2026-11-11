import { prisma } from "@/lib/db";
import { withAuth, ok, err } from "@/lib/api";

export const DELETE = withAuth(async (_req, _ctx, paramsPromise) => {
  try {
    const { id: postId, commentId } = await paramsPromise;

    const existing = await prisma.newsComment.findFirst({
      where: { id: commentId, postId },
    });

    if (!existing) {
      return err("التعليق غير موجود", 404);
    }

    const post = await prisma.newsPost.findUnique({
      where: { id: postId },
      select: { commentsCount: true },
    });

    await prisma.newsComment.delete({ where: { id: commentId } });

    const newCount = Math.max(0, (post?.commentsCount ?? 1) - 1);
    await prisma.newsPost.update({
      where: { id: postId },
      data: { commentsCount: newCount },
    });

    return ok({ deleted: true, commentsCount: newCount });
  } catch (error) {
    console.error("[Comment DELETE Error]:", error);
    return err("فشل حذف التعليق", 500);
  }
}, "cms:delete");

