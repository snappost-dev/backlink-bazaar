import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Lock, AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import prisma from "@/lib/prisma";
import { AgencyInventoryClient } from "./AgencyInventoryClient";
import {
  formatOrigin,
  formatVerificationStatus,
  formatDomain,
  formatPrice,
} from "@/lib/utils";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AgencyInventoryPage() {
  // Prisma ile gerçek verileri çek
  const sites = await prisma.site.findMany({
    where: {
      origin: "AGENCY_PORTFOLIO",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
            ÖZEL PORTFÖY (VECTOR + DYNAMIC)
          </h1>
          <p className="mt-2 text-slate-600">
            Ajans portföyünüze özel siteler ekleyin (Doğrulama gerekmez)
          </p>
          <p className="mt-1 text-xs text-green-600 font-semibold">
            ✓ Veritabanı Bağlantısı Aktif
          </p>
        </div>
        <AgencyInventoryClient />
      </div>

      {/* Info Card */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-indigo-900">Özel Portföy Nedir?</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-indigo-700">
            Özel portföy, ajansın kendi keşfettiği ve yönetimini üstlendiği siteleri içerir.
            Bu siteler doğrulama gerektirmez ve sadece ajans tarafından görülebilir.
            Müşterilerinize özel fiyatlandırma yapabilirsiniz.
          </p>
        </CardContent>
      </Card>

      {/* Empty State */}
      {sites.length === 0 ? (
        <Card className="border-dashed border-2 border-indigo-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Henüz özel portföy siteniz yok
            </h3>
            <p className="text-sm text-slate-600 text-center max-w-md mb-4">
              Ajans portföyünüze ilk sitenizi ekleyerek başlayın. Bu siteler doğrulama
              gerektirmez ve sadece sizin tarafınızdan görülebilir.
            </p>
            <AgencyInventoryClient />
          </CardContent>
        </Card>
      ) : (
        /* Private Sites List */
        <div className="grid grid-cols-1 gap-4">
          {sites.map((site: typeof sites[0]) => {
            // Parse JSON fields
            const metrics = (site.metrics as { da?: number; dr?: number; spam?: number }) || {};
            const traffic = (site.traffic as {
              monthly?: number;
              organic?: number;
              referral?: number;
            }) || {};

            return (
              <Card key={site.id} className="border-indigo-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Link href={`/agency/inventory/${site.id}`} className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-[2.5rem] bg-indigo-100 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl hover:text-indigo-600 transition-colors">
                          {formatDomain(site.domain)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {site.category || "Kategori Belirtilmedi"} • {formatOrigin(site.origin)}
                        </CardDescription>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      {site.isPrivate && (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-indigo-100 text-indigo-700 text-sm font-medium">
                          <Lock className="w-4 h-4" />
                          Özel
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Status and Price Row */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        Durum:{" "}
                        <span className="font-semibold text-slate-900">
                          {formatVerificationStatus(site.verificationStatus)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-indigo-600">
                            {formatPrice(site.finalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Traffic and Metrics Row */}
                    {(traffic.monthly || traffic.organic || metrics.da || metrics.dr) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                        {/* Traffic */}
                        {traffic.monthly && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <TrendingUp className="w-3 h-3" />
                              <span>Aylık Trafik</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">
                              {traffic.monthly.toLocaleString()}
                            </p>
                            {traffic.organic && (
                              <p className="text-xs text-slate-500">
                                {traffic.organic.toLocaleString()} organik
                              </p>
                            )}
                          </div>
                        )}

                        {/* DA */}
                        {metrics.da !== undefined && (
                          <div className="space-y-1">
                            <div className="text-xs text-slate-500">Domain Authority</div>
                            <p className="text-sm font-semibold text-slate-900">{metrics.da}</p>
                          </div>
                        )}

                        {/* DR */}
                        {metrics.dr !== undefined && (
                          <div className="space-y-1">
                            <div className="text-xs text-slate-500">Domain Rating</div>
                            <p className="text-sm font-semibold text-slate-900">{metrics.dr}</p>
                          </div>
                        )}

                        {/* Spam Score */}
                        {metrics.spam !== undefined && (
                          <div className="space-y-1">
                            <div className="text-xs text-slate-500">Spam Skoru</div>
                            <p className="text-sm font-semibold text-slate-900">{metrics.spam}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-end justify-end pt-2">
                      <Link href={`/agency/inventory/${site.id}`}>
                        <Button variant="outline" size="sm" className="rounded-[2.5rem]">
                          Yönet
                        </Button>
                      </Link>
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
