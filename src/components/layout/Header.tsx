"use client";

import { usePathname, useRouter } from "next/navigation";
import { ROLE_CONFIGS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type RoleKey = keyof typeof ROLE_CONFIGS;

const ROLE_ROUTES: Record<string, { key: RoleKey; label: string; path: string; color: string; bgColor: string }> = {
  publisher: {
    key: "PUBLISHER",
    label: "Yayıncı",
    path: "/publisher/inventory",
    color: "blue",
    bgColor: "bg-blue-600",
  },
  agency: {
    key: "AGENCY",
    label: "Ajans",
    path: "/agency/vetting",
    color: "indigo",
    bgColor: "bg-indigo-600",
  },
  buyer: {
    key: "BUYER",
    label: "Alıcı",
    path: "/buyer/marketplace",
    color: "slate",
    bgColor: "bg-slate-900",
  },
  admin: {
    key: "ADMIN",
    label: "Admin",
    path: "/admin/dashboard",
    color: "red",
    bgColor: "bg-red-600",
  },
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // Mevcut rolü pathname'den belirle
  const getCurrentRole = (): string => {
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/publisher")) return "publisher";
    if (pathname.startsWith("/agency")) return "agency";
    if (pathname.startsWith("/buyer")) return "buyer";
    return "publisher"; // default
  };

  const currentRole = getCurrentRole();
  const currentRoleConfig = ROLE_CONFIGS[ROLE_ROUTES[currentRole].key];

  // Sayfa başlığını bul
  const pageTitle = currentRoleConfig.menu.find((m) => m.path === pathname)?.label || "Dashboard";

  const handleRoleChange = (roleKey: string) => {
    const role = ROLE_ROUTES[roleKey];
    if (role) {
      router.push(role.path);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 rounded-bl-[2.5rem]">
      {/* Sayfa Başlığı */}
      <h2 className="text-lg font-semibold text-slate-900">{pageTitle}</h2>

      {/* Sağ Taraf: Role Switcher + Tarih */}
      <div className="flex items-center gap-6">
        {/* Role Switcher - Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {Object.entries(ROLE_ROUTES).map(([key, role]) => {
            const isActive = currentRole === key;
            return (
              <button
                key={key}
                onClick={() => handleRoleChange(key)}
                className={cn(
                  "px-4 py-2 rounded-lg font-black uppercase text-xs tracking-tight transition-all",
                  "min-w-[80px]",
                  isActive
                    ? `${role.bgColor} text-white shadow-sm`
                    : "text-slate-500 hover:text-slate-700 hover:bg-white"
                )}
              >
                {role.label}
              </button>
            );
          })}
        </div>

        {/* Tarih */}
        <span className="text-sm text-slate-500">
          {new Date().toLocaleDateString("tr-TR")}
        </span>
      </div>
    </header>
  );
}

