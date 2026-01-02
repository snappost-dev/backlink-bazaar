"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Eye, DollarSign, Link2 } from "lucide-react";
import { MOCK_SITES, TRAFFIC_DATA } from "@/lib/mock-data";

export default function AnalyticsPage() {
  const totalRevenue = MOCK_SITES.reduce((acc, site) => acc + site.finalPrice, 0);
  const totalLinks = MOCK_SITES.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
          Analitik
        </h1>
        <p className="mt-2 text-slate-600">
          Performans metriklerinizi ve istatistiklerinizi görüntüleyin
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Toplam Trafik</CardDescription>
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">
              {TRAFFIC_DATA.monthly.toLocaleString("tr-TR")}
            </CardTitle>
            <p className="text-xs text-green-600 mt-1">
              +{TRAFFIC_DATA.growth}% bu ay
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Toplam Gelir</CardDescription>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              ${totalRevenue.toLocaleString("tr-TR")}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">Tüm zamanlar</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Aktif Bağlantılar</CardDescription>
              <Link2 className="w-5 h-5 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">{totalLinks}</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Doğrulanmış siteler</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Ortalama Fiyat</CardDescription>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <CardTitle className="text-2xl">
              ${Math.round(totalRevenue / totalLinks).toLocaleString("tr-TR")}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">Bağlantı başına</p>
          </CardHeader>
        </Card>
      </div>

      {/* Traffic Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Trafik Dağılımı</CardTitle>
            <CardDescription>Aylık trafik kaynakları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Organik Trafik</span>
                  <span className="font-semibold">
                    {TRAFFIC_DATA.organic.toLocaleString("tr-TR")}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{
                      width: `${(TRAFFIC_DATA.organic / TRAFFIC_DATA.monthly) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Referral Trafik</span>
                  <span className="font-semibold">
                    {TRAFFIC_DATA.referral.toLocaleString("tr-TR")}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full"
                    style={{
                      width: `${(TRAFFIC_DATA.referral / TRAFFIC_DATA.monthly) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Site Performansı</CardTitle>
            <CardDescription>En iyi performans gösteren siteler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_SITES.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between p-3 rounded-[2.5rem] bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{site.domain}</p>
                    <p className="text-xs text-slate-500">
                      {site.traffic.monthly.toLocaleString("tr-TR")} ziyaretçi
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">${site.finalPrice}</p>
                    <p className="text-xs text-slate-500">DA: {site.metrics.da}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

