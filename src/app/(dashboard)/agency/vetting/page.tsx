import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, CheckCircle2, XCircle, Clock, Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { VettingClient } from "./VettingClient";
import { formatDomain, formatPrice } from "@/lib/utils";

export const dynamic = 'force-dynamic';

// Trust Score hesaplama (0-100)
function calculateTrustScore(metrics: { da?: number; dr?: number; spam?: number }): number {
  const da = metrics.da || 0;
  const dr = metrics.dr || 0;
  const spam = metrics.spam || 0;
  const daScore = da * 1.2;
  const drScore = dr * 1.0;
  const spamPenalty = spam * 10;
  const score = Math.min(100, Math.max(0, (daScore + drScore) - spamPenalty));
  return Math.round(score);
}

export default async function VettingPage() {
  // Prisma ile PENDING veya UNVERIFIED siteleri çek
  const sites = await prisma.site.findMany({
    where: {
      OR: [
        { verificationStatus: "PENDING" },
        { verificationStatus: "UNVERIFIED" },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Stats hesapla
  const totalSites = sites.length;
  const approvedSites = sites.filter((s: typeof sites[0]) => s.status === "approved").length;
  const pendingSites = sites.filter((s: typeof sites[0]) => s.status === "pending" || s.verificationStatus === "PENDING" || s.verificationStatus === "UNVERIFIED").length;
  const rejectedSites = sites.filter((s: typeof sites[0]) => s.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
            Vetting Pool
          </h1>
          <p className="mt-2 text-slate-600">
            Siteleri analiz edin ve doğrulayın
          </p>
        </div>
        <VettingClient />
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
            <div className="flex items-center justify-between">
              <CardDescription>Onaylanan</CardDescription>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">{approvedSites}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Beklemede</CardDescription>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-600">{pendingSites}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Reddedilen</CardDescription>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">{rejectedSites}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Empty State */}
      {sites.length === 0 ? (
        <Card className="border-dashed border-2 border-indigo-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Onay bekleyen site yok
            </h3>
            <p className="text-sm text-slate-600 text-center max-w-md">
              Şu an onay bekleyen site bulunmuyor. Yeni siteler eklendiğinde burada görünecektir.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Vetting Queue */
        <div className="grid grid-cols-1 gap-4">
          {sites.map((site: typeof sites[0]) => {
            const metrics = (site.metrics as { da?: number; dr?: number; spam?: number }) || {};
            const traffic = (site.traffic as {
              monthly?: number;
              organic?: number;
              referral?: number;
            }) || {};
            const trustScore = calculateTrustScore(metrics);

            return (
              <Card key={site.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{formatDomain(site.domain)}</CardTitle>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-[2.5rem] bg-indigo-100 text-indigo-700">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm font-semibold">Trust: {trustScore}</span>
                        </div>
                      </div>
                      <CardDescription className="mt-1">
                        {site.category || "Kategori Belirtilmedi"} • DA: {metrics.da || 0} • DR:{" "}
                        {metrics.dr || 0} • Spam: {metrics.spam || 0}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {site.status === "approved" ? (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-green-100 text-green-700 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Onaylandı
                        </span>
                      ) : site.verificationStatus === "PENDING" || site.verificationStatus === "UNVERIFIED" ? (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-yellow-100 text-yellow-700 text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          Beklemede
                        </span>
                      ) : site.status === "rejected" ? (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-red-100 text-red-700 text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          Reddedildi
                        </span>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Metrics */}
                    {(traffic.monthly || traffic.organic) && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-slate-600">Metrikler</div>
                        <div className="pl-6 space-y-1">
                          {traffic.monthly && (
                            <p className="text-sm">
                              Trafik:{" "}
                              <span className="font-semibold">
                                {traffic.monthly.toLocaleString("tr-TR")}
                              </span>
                            </p>
                          )}
                          {traffic.organic && (
                            <p className="text-sm">
                              Organik:{" "}
                              <span className="font-semibold">
                                {traffic.organic.toLocaleString("tr-TR")}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-600">Fiyatlandırma</div>
                      <div className="pl-6 space-y-1">
                        <p className="text-sm">
                          Base: <span className="font-semibold">{formatPrice(site.basePrice)}</span>
                        </p>
                        <p className="text-sm">
                          Final:{" "}
                          <span className="font-semibold text-indigo-600">
                            {formatPrice(site.finalPrice)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-end justify-end gap-2">
                      {(site.verificationStatus === "PENDING" || site.verificationStatus === "UNVERIFIED") && (
                        <VettingClient siteId={site.id} siteFinalPrice={site.finalPrice} />
                      )}
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
