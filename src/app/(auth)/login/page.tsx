"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Building2, Globe, ShoppingCart, ArrowRight } from "lucide-react";

const ROLE_CONFIGS = [
  {
    id: "publisher",
    label: "Yayıncı Girişi",
    description: "Sitelerinizi yönetin ve gelir elde edin",
    icon: Globe,
    color: "blue",
    bgColor: "bg-blue-600",
    hoverColor: "hover:bg-blue-700",
    path: "/publisher/inventory",
    email: "pub@otohaber.com",
  },
  {
    id: "agency",
    label: "Ajans Girişi",
    description: "Siteleri analiz edin ve müşterilerinize hizmet verin",
    icon: Building2,
    color: "indigo",
    bgColor: "bg-indigo-600",
    hoverColor: "hover:bg-indigo-700",
    path: "/agency/vetting",
    email: "agency@blue-seo.com",
  },
  {
    id: "buyer",
    label: "Alıcı Girişi",
    description: "Doğrulanmış sitelerden backlink satın alın",
    icon: ShoppingCart,
    color: "slate",
    bgColor: "bg-slate-900",
    hoverColor: "hover:bg-slate-800",
    path: "/buyer/marketplace",
    email: "client@brand.com",
  },
  {
    id: "admin",
    label: "Sistem Yönetimi",
    description: "Platform yönetimi ve denetim",
    icon: Shield,
    color: "red",
    bgColor: "bg-red-600",
    hoverColor: "hover:bg-red-700",
    path: "/admin/dashboard",
    email: "admin@snappost.app",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (path: string) => {
    // Mock Login: Direkt dashboard'a yönlendir
    // Gerçek uygulamada auth token set edilir
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black uppercase tracking-tight text-slate-900">
            Backlink Bazaar
          </h1>
          <p className="text-lg text-slate-600">
            Rolünüze göre giriş yapın
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ROLE_CONFIGS.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.id}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-slate-300"
                onClick={() => handleLogin(role.path)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-16 h-16 rounded-[2.5rem] ${role.bgColor} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">
                          {role.label}
                        </CardTitle>
                        <CardDescription className="mt-2 text-base">
                          {role.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                      <span className="font-medium">Test Kullanıcı:</span>{" "}
                      <span className="font-mono">{role.email}</span>
                    </div>
                    <Button
                      className={`${role.bgColor} ${role.hoverColor} rounded-[2.5rem] px-6`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogin(role.path);
                      }}
                    >
                      Giriş Yap
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-slate-500">
          <p>
            Mock Login: Herhangi bir karta tıklayarak ilgili dashboard'a
            yönlendirilirsiniz
          </p>
        </div>
      </div>
    </div>
  );
}

