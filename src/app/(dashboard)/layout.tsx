"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_CONFIGS, type ROLE_CONFIGS as RoleConfigsType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Header from "@/components/layout/Header";

type RoleKey = keyof typeof ROLE_CONFIGS;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Rolü pathname'den belirle
  const getRoleFromPath = (path: string): RoleKey => {
    if (path.startsWith("/publisher")) return "PUBLISHER";
    if (path.startsWith("/agency")) return "AGENCY";
    if (path.startsWith("/buyer")) return "BUYER";
    if (path.startsWith("/admin")) return "ADMIN";
    return "PUBLISHER"; // default
  };

  const [currentRole, setCurrentRole] = useState<RoleKey>(() => getRoleFromPath(pathname));
  
  // Pathname değiştiğinde rolü güncelle
  useEffect(() => {
    const role = getRoleFromPath(pathname);
    setCurrentRole(role);
  }, [pathname]);

  const roleConfig = ROLE_CONFIGS[currentRole];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 border-r border-slate-200 bg-white",
          "flex flex-col"
        )}
      >
        {/* Logo/Brand */}
        <div
          className={cn(
            "h-16 border-b border-slate-200 flex items-center justify-center",
            roleConfig.bgColor,
            "rounded-br-[2.5rem]"
          )}
        >
          <h1 className="text-white font-black text-xl uppercase tracking-tight">
            Backlink Bazaar
          </h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {roleConfig.menu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.id}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-[2.5rem] transition-colors",
                  isActive
                    ? `${roleConfig.bgColor} text-white`
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info (Mock) */}
        <div className="p-4 border-t border-slate-200">
          <div className="space-y-2">
            {/* Rol Değiştirici */}
            <div className="relative">
              <select
                value={currentRole}
                onChange={(e) => {
                  const newRole = e.target.value as RoleKey;
                  setCurrentRole(newRole);
                  // İlk menü öğesine yönlendir
                  const firstMenuPath = ROLE_CONFIGS[newRole].menu[0].path;
                  router.push(firstMenuPath);
                }}
                className={cn(
                  "w-full px-4 py-3 rounded-[2.5rem] border-2 border-slate-300",
                  "bg-white text-slate-900 font-semibold text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2",
                  "appearance-none cursor-pointer",
                  `focus:ring-${roleConfig.color}-500`
                )}
              >
                <option value="PUBLISHER">Publisher</option>
                <option value="AGENCY">Agency</option>
                <option value="BUYER">Buyer</option>
                <option value="ADMIN">Admin</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            
            {/* User Info */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-[2.5rem] bg-slate-100">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                  roleConfig.bgColor
                )}
              >
                {currentRole[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {currentRole}
                </p>
                <p className="text-xs text-slate-500">Mock User</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header with Role Switcher */}
        <Header />

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

