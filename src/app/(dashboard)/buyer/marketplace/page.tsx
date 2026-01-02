import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Globe, AlertCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { MarketplaceClient } from "./MarketplaceClient";
import { formatDomain, formatPrice } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  // Prisma ile gerçek verileri çek - Sadece APPROVED siteler
  const sites = await prisma.site.findMany({
    where: {
      origin: "AGENCY_PORTFOLIO",
      status: "approved", // Sadece onaylanmış siteler
      verificationStatus: "VERIFIED", // Doğrulanmış siteler
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Stats hesapla
  const totalSites = sites.length;
  const avgPrice =
    sites.length > 0
      ? Math.round(sites.reduce((acc: number, s: typeof sites[0]) => acc + s.finalPrice, 0) / sites.length)
      : 0;
  const categories = new Set(sites.map((s: typeof sites[0]) => s.category)).size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
            Marketplace
          </h1>
          <p className="mt-2 text-slate-600">
            Ajans portföyünden backlink satın alın
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Site</CardDescription>
            <CardTitle className="text-2xl">{totalSites}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ortalama Fiyat</CardDescription>
            <CardTitle className="text-2xl">${avgPrice}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Kategoriler</CardDescription>
            <CardTitle className="text-2xl">{categories}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Empty State */}
      {sites.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Şu an listelenecek site yok
            </h3>
            <p className="text-sm text-slate-600 text-center max-w-md">
              Ajans portföyünde henüz site bulunmuyor. Lütfen daha sonra tekrar kontrol edin.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Sites Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site: typeof sites[0]) => {
            // Parse JSON fields with null checks
            const metrics = (site.metrics as { da?: number; dr?: number; spam?: number }) || {};
            const traffic = (site.traffic as {
              monthly?: number;
              organic?: number;
              referral?: number;
            }) || {};

            return (
              <Card key={site.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-[2.5rem] bg-slate-900 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{formatDomain(site.domain)}</CardTitle>
                        <CardDescription className="mt-1">
                          {site.category || "Kategori Belirtilmedi"}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metrics */}
                  {(metrics.da !== undefined || metrics.dr !== undefined || traffic.monthly || metrics.spam !== undefined) && (
                    <div className="space-y-2">
                      {(metrics.da !== undefined || metrics.dr !== undefined) && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">DA / DR</span>
                          <span className="font-semibold">
                            {metrics.da ?? "N/A"} / {metrics.dr ?? "N/A"}
                          </span>
                        </div>
                      )}
                      {traffic.monthly && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Aylık Trafik</span>
                          <span className="font-semibold">
                            {traffic.monthly.toLocaleString("tr-TR")}
                          </span>
                        </div>
                      )}
                      {metrics.spam !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Spam Skoru</span>
                          <span className="font-semibold">{metrics.spam}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-slate-600">Fiyat</span>
                      <span className="text-2xl font-black text-slate-900">
                        {site.finalPrice ? formatPrice(site.finalPrice) : "Fiyat Sorunuz"}
                      </span>
                    </div>
                    <MarketplaceClient site={site} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
