"use client";

import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  roles: string[];
  group: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", roles: ["OWNER", "ADMIN", "EMPLOYEE", "MANAGER", "PROCUREMENT", "WAREHOUSE", "FINANCE"], group: "Home" },
  { href: "/dashboard/departments", label: "Departments", roles: ["OWNER", "ADMIN"], group: "Master Data" },
  { href: "/dashboard/users", label: "Users", roles: ["OWNER", "ADMIN"], group: "Master Data" },
  { href: "/dashboard/vendors", label: "Vendors", roles: ["OWNER", "ADMIN", "PROCUREMENT"], group: "Master Data" },
  { href: "/dashboard/products", label: "Products", roles: ["OWNER", "ADMIN", "PROCUREMENT", "WAREHOUSE"], group: "Master Data" },
  { href: "/dashboard/warehouses", label: "Warehouses", roles: ["OWNER", "ADMIN", "WAREHOUSE"], group: "Master Data" },
  { href: "/dashboard/purchase-requests", label: "Purchase Requests", roles: ["OWNER", "ADMIN", "EMPLOYEE", "MANAGER", "PROCUREMENT"], group: "Procurement" },
  { href: "/dashboard/purchase-orders", label: "Purchase Orders", roles: ["OWNER", "ADMIN", "PROCUREMENT"], group: "Procurement" },
  { href: "/dashboard/goods-receipts", label: "Goods Receipts", roles: ["OWNER", "ADMIN", "WAREHOUSE", "PROCUREMENT"], group: "Procurement" },
  { href: "/dashboard/invoices", label: "Invoices", roles: ["OWNER", "ADMIN", "FINANCE"], group: "Procurement" },
  { href: "/dashboard/stocks", label: "Inventory", roles: ["OWNER", "ADMIN", "WAREHOUSE"], group: "Inventory" },
  { href: "/dashboard/audit-logs", label: "Audit Logs", roles: ["OWNER", "ADMIN"], group: "System" },
];

function DashboardNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const visibleItems = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  const groups = visibleItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-bold text-white">ProcureHub</h2>
        <p className="text-xs text-gray-400 mt-1 truncate">{user?.email}</p>
        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 text-[10px] font-semibold uppercase tracking-wide">
          {user?.role}
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{group}</p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive = item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 rounded-lg text-sm transition ${
                      isActive
                        ? "bg-gray-700 text-white font-medium"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => { logout(); router.push("/"); }}
          className="w-full text-sm text-gray-400 hover:text-white text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
