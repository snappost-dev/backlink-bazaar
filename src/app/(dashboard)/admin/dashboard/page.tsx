"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Building2, Activity } from "lucide-react";

export default function AdminDashboardPage() {
  const globalTVL = 1240000; // ₺1.240K
  const activeAgencies = 48;
  const totalUsers = 1247;
  const pendingDisputes = 3;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
          Sistem Yönetimi
        </h1>
        <p className="mt-2 text-slate-600">
          Global platform istatistikleri ve denetim merkezi
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Global TVL */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-red-700">Global TVL</CardDescription>
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">
              ₺{(globalTVL / 1000).toFixed(1)}K
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Aktif Ajanslar */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-red-700">Aktif Ajanslar</CardDescription>
              <Building2 className="w-5 h-5 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">{activeAgencies}</CardTitle>
          </CardHeader>
        </Card>

        {/* Toplam Kullanıcı */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-red-700">Toplam Kullanıcı</CardDescription>
              <Activity className="w-5 h-5 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">
              {totalUsers.toLocaleString("tr-TR")}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Bekleyen Uyuşmazlıklar */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-red-700">Bekleyen Uyuşmazlıklar</CardDescription>
              <Activity className="w-5 h-5 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">{pendingDisputes}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Global Logs Placeholder */}
      <Card className="border-red-200 bg-red-50 min-h-[500px]">
        <CardHeader>
          <CardTitle className="text-xl text-red-700">Global Loglar</CardTitle>
          <CardDescription className="text-red-600">
            Sistem aktivite logları ve denetim kayıtları
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] rounded-[2.5rem] bg-white border-2 border-dashed border-red-300">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <Activity className="w-8 h-8 text-red-600 animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-semibold text-red-700">
                  Global Loglar İşleniyor...
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Sistem logları analiz ediliyor
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

