import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { UserRole } from "@prisma/client";

const registerSchema = z.object({
  name: z.string().trim().min(2, "يرجى كتابة الاسم الكامل (حرفين على الأقل)").max(80),
  email: z.string().trim().email("البريد الإلكتروني غير صالح"),
  phone: z.string().trim().min(7, "رقم الهاتف غير صالح").max(20).optional().or(z.literal("")),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "بيانات التسجيل غير صالحة", 400);
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return err("هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول.", 409);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.CUSTOMER,
        isActive: true,
        customer: {
          create: {
            nameAr: parsed.data.name,
            phone: parsed.data.phone || null,
            loyaltyAccount: {
              create: {
                points: 0,
                tier: "BRONZE",
              },
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return ok({ user }, 201);
  } catch (error) {
    console.error("[Register POST Error]:", error);
    return err("حدث خطأ أثناء إنشاء الحساب", 500);
  }
}

