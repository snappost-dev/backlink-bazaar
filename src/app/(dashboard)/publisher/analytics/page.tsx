import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Eye, DollarSign, Link2, AlertCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatDomain, formatPrice } from "@/lib/utils";

export default async function AnalyticsPage() {
  // Publisher'ın sitelerini çek
  const sites = await prisma.site.findMany({
    where: {
      origin: "PUBLISHER_OWNED",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Stats hesapla
  const totalRevenue = sites.reduce((acc: number, s: typeof sites[0]) => acc + s.finalPrice, 0);
  const totalLinks = sites.length;
  const avgPrice = totalLinks > 0 ? Math.round(totalRevenue / totalLinks) : 0;

  // Traffic toplamı (JSON'dan parse)
  const totalTraffic = sites.reduce((acc: number, s: typeof sites[0]) => {
    const traffic = (s.traffic as { monthly?: number }) || {};
    return acc + (traffic.monthly || 0);
  }, 0);

  const organicTraffic = sites.reduce((acc: number, s: typeof sites[0]) => {
    const traffic = (s.traffic as { organic?: number }) || {};
    return acc + (traffic.organic || 0);
  }, 0);

  const referralTraffic = sites.reduce((acc: number, s: typeof sites[0]) => {
    const traffic = (s.traffic as { referral?: number }) || {};
    return acc + (traffic.referral || 0);
  }, 0);

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

      {/* Empty State */}
      {sites.length === 0 ? (
        <Card className="border-dashed border-2 border-blue-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Henüz veri yok
            </h3>
            <p className="text-sm text-slate-600 text-center max-w-md">
              Analitik verilerini görmek için önce envanterinize site eklemeniz gerekiyor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>Toplam Trafik</CardDescription>
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">
                  {totalTraffic.toLocaleString("tr-TR")}
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1">Tüm siteler</p>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>Toplam Gelir</CardDescription>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-600">
                  {formatPrice(totalRevenue)}
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
                  {formatPrice(avgPrice)}
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
                  {totalTraffic > 0 && (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600">Organik Trafik</span>
                          <span className="font-semibold">
                            {organicTraffic.toLocaleString("tr-TR")}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full"
                            style={{
                              width: `${totalTraffic > 0 ? (organicTraffic / totalTraffic) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600">Referral Trafik</span>
                          <span className="font-semibold">
                            {referralTraffic.toLocaleString("tr-TR")}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className="bg-indigo-600 h-3 rounded-full"
                            style={{
                              width: `${totalTraffic > 0 ? (referralTraffic / totalTraffic) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Site Performansı</CardTitle>
                <CardDescription>En iyi performans gösteren siteler</CardDescription>
              </CardHeader>
              <CardContent>
                {sites.length === 0 ? (
                  <p className="text-sm text-slate-500">Henüz site yok</p>
                ) : (
                  <div className="space-y-3">
                    {sites.map((site: typeof sites[0]) => {
                      const traffic = (site.traffic as { monthly?: number }) || {};
                      const metrics = (site.metrics as { da?: number }) || {};
                      return (
                        <div
                          key={site.id}
                          className="flex items-center justify-between p-3 rounded-[2.5rem] bg-slate-50"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{formatDomain(site.domain)}</p>
                            <p className="text-xs text-slate-500">
                              {(traffic.monthly || 0).toLocaleString("tr-TR")} ziyaretçi
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600">{formatPrice(site.finalPrice)}</p>
                            <p className="text-xs text-slate-500">DA: {metrics.da || 0}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
