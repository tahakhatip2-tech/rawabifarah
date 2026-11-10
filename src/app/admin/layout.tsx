import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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
    "SUPER_ADMIN", "BUSINESS_OWNER", "BRANCH_MANAGER",
    "CASHIER", "WAREHOUSE_STAFF", "PRODUCTION_STAFF", "CONTENT_MANAGER",
  ];

  if (!adminRoles.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return (
    <div className="admin-layout bg-[var(--color-bg)]">
      {/* Sidebar placeholder — built in next step */}
      <aside
        id="admin-sidebar"
        className="h-screen sticky top-0 overflow-y-auto"
        style={{ background: "var(--sidebar-bg)" }}
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-stone-900 border border-amber-500/30 p-1 flex items-center justify-center">
              <Image
                src="/rwabifarah.png"
                alt="شعار روابي الفرح"
                width={40}
                height={40}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <p className="text-white font-bold text-sm">روابي الفرح</p>
              <p className="text-[var(--sidebar-text)] text-xs opacity-60">
                {session.user.role}
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { href: "/admin/dashboard", label: "لوحة التحكم", icon: "📊" },
              { href: "/admin/products", label: "المنتجات", icon: "🍞" },
              { href: "/admin/inventory", label: "المخزون", icon: "📦" },
              { href: "/admin/procurement", label: "المشتريات", icon: "🛒" },
              { href: "/admin/production", label: "الإنتاج", icon: "🏭" },
              { href: "/admin/sales", label: "المبيعات", icon: "💰" },
              { href: "/admin/customers", label: "العملاء", icon: "👥" },
              { href: "/admin/employees", label: "الموظفون", icon: "👤" },
              { href: "/admin/finance", label: "المالية", icon: "📈" },
              { href: "/admin/reports", label: "التقارير", icon: "📋" },
              { href: "/admin/cms", label: "المحتوى", icon: "📝" },
              { href: "/admin/settings", label: "الإعدادات", icon: "⚙️" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[var(--sidebar-text)] hover:bg-white/10 transition-all duration-200 text-sm font-medium"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
