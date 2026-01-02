import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, CheckCircle2, Clock, TrendingUp, Plus, AlertCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { InventoryClient } from "./InventoryClient";
import { formatVerificationStatus, formatDomain, formatPrice } from "@/lib/utils";

export default async function InventoryPage() {
  // Prisma ile gerçek verileri çek
  const sites = await prisma.site.findMany({
    where: {
      origin: "PUBLISHER_OWNED",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      publisher: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  // Stats hesapla
  const totalSites = sites.length;
  const verifiedSites = sites.filter((s: typeof sites[0]) => s.verificationStatus === "VERIFIED").length;
  const pendingSites = sites.filter((s: typeof sites[0]) => s.verificationStatus === "PENDING").length;
  const avgPrice =
    sites.length > 0
      ? Math.round(sites.reduce((acc: number, s: typeof sites[0]) => acc + s.finalPrice, 0) / sites.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
            Envanter
          </h1>
          <p className="mt-2 text-slate-600">
            Sitelerinizi yönetin ve doğrulama durumlarını takip edin
          </p>
        </div>
        <InventoryClient />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Site</CardDescription>
            <CardTitle className="text-2xl">{totalSites}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Doğrulanmış</CardDescription>
            <CardTitle className="text-2xl">{verifiedSites}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Beklemede</CardDescription>
            <CardTitle className="text-2xl">{pendingSites}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ortalama Fiyat</CardDescription>
            <CardTitle className="text-2xl">${avgPrice}</CardTitle>
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
              Henüz site eklemediniz
            </h3>
            <p className="text-sm text-slate-600 text-center max-w-md mb-4">
              Envanterinize ilk sitenizi ekleyerek başlayın. Site ekledikten sonra doğrulama
              sürecinden geçecektir.
            </p>
            <InventoryClient />
          </CardContent>
        </Card>
      ) : (
        /* Sites List */
        <div className="grid grid-cols-1 gap-4">
          {sites.map((site: typeof sites[0]) => {
            const metrics = site.metrics as { da?: number; dr?: number; spam?: number };
            const traffic = site.traffic as {
              monthly?: number;
              organic?: number;
              referral?: number;
            };

            return (
              <Card key={site.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-[2.5rem] bg-blue-100 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{formatDomain(site.domain)}</CardTitle>
                        <CardDescription className="mt-1">
                          {site.category || "Kategori Belirtilmedi"} • DA: {metrics.da || 0} • DR:{" "}
                          {metrics.dr || 0}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {site.verificationStatus === "VERIFIED" ? (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-green-100 text-green-700 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          {formatVerificationStatus(site.verificationStatus)}
                        </span>
                      ) : site.verificationStatus === "PENDING" ? (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-yellow-100 text-yellow-700 text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          {formatVerificationStatus(site.verificationStatus)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-slate-100 text-slate-700 text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          {formatVerificationStatus(site.verificationStatus)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Traffic Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">Trafik</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        <p className="text-sm">
                          <span className="font-semibold text-slate-900">
                            {(traffic.monthly || 0).toLocaleString()}
                          </span>{" "}
                          aylık ziyaretçi
                        </p>
                        <p className="text-xs text-slate-500">
                          {(traffic.organic || 0).toLocaleString()} organik
                        </p>
                      </div>
                    </div>

                    {/* Pricing Info */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-600">Fiyatlandırma</div>
                    <div className="pl-6 space-y-1">
                      <p className="text-sm">
                        <span className="font-semibold text-blue-600">
                          {formatPrice(site.finalPrice)}
                        </span>{" "}
                        / bağlantı
                      </p>
                      <p className="text-xs text-slate-500">Base: {formatPrice(site.basePrice)}</p>
                    </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-end justify-end">
                      <Button variant="outline" size="sm">
                        Detaylar
                      </Button>
                    </div>
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
