import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "لوحة الإدارة" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/admin/dashboard");
  }

  const adminRoles = [
    "SUPER_ADMIN",
    "BUSINESS_OWNER",
    "BRANCH_MANAGER",
    "CASHIER",
    "WAREHOUSE_STAFF",
    "PRODUCTION_STAFF",
    "CONTENT_MANAGER",
  ];

  if (!adminRoles.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return (
    <AdminShell
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
