import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Clock, XCircle, Shield } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatDomain, formatPrice, formatVerificationStatus } from "@/lib/utils";
import Link from "next/link";
import { InventoryDetailClient } from "./InventoryDetailClient";
import { TrafficSparkline } from "./TrafficSparkline";

// Trafik değerini formatla (Milyon/Bin)
function formatTrafficValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString("tr-TR");
}

export const dynamic = 'force-dynamic';

// Trust Score hesaplama
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

export default async function InventoryDetailPage({ params }: { params: { id: string } }) {
  // 1. SITE ID: URL'den gelen params.id bizim siteId'mizdir
  const siteId = params.id;

  // Site'i veritabanından çek (Hybrid SEO Engine v2.0 - Yeni skor alanları ile)
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      domain: true,
      basePrice: true,
      finalPrice: true,
      status: true,
      category: true,
      verificationStatus: true,
      createdAt: true,
      metrics: true,
      traffic: true,
      rawSeoData: true,
      snappostScore: true,
      trafficData: true,
      lastSeoCheck: true,
      // Hybrid SEO Engine v2.0 - Yeni alanlar
      s_tech: true,
      s_sem: true,
      s_link: true,
      s_schema: true,
      s_mon: true,
      s_eeat: true,
      s_fresh: true,
      s_viral: true,
      s_ux: true,
      s_global: true,
      seoFixes: true,
    },
  });

  // 2. AGENCY ID (Akıllı Seçim - Development Friendly)
  // Önce admin@snappost.app kullanıcısını bul
  let agency = await prisma.user.findUnique({
    where: { email: 'admin@snappost.app' },
    select: { id: true },
  });

  // YOKSA: upsert ile oluştur (role='AGENCY', credits=99999)
  if (!agency) {
    agency = await prisma.user.upsert({
      where: { email: 'admin@snappost.app' },
      update: {
        role: 'AGENCY',
        credits: 99999, // Development için yüksek kredi
      },
      create: {
        email: 'admin@snappost.app',
        name: 'Development Admin',
        role: 'AGENCY',
        credits: 99999,
      },
      select: { id: true },
    });
  }

  const agencyId = agency.id;

  if (!site) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed border-2 border-red-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Site bulunamadı</h3>
            <p className="text-sm text-slate-600 text-center max-w-md mb-4">
              Aradığınız site mevcut değil veya silinmiş olabilir.
            </p>
            <Link href="/agency/inventory">
              <Button variant="outline">Özel Portföy'e Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = (site.metrics as { da?: number; dr?: number; spam?: number }) || {};
  const traffic = (site.traffic as {
    monthly?: number;
    organic?: number;
    referral?: number;
  }) || {};

  // DataForSEO verileri (Raw-Analysis-Push Mimarisi)
  // İşlenmiş veriler (hızlı okuma için)
  const trafficData = (site.trafficData as {
    estimatedTrafficValue?: number;
    history?: Array<{ date: string; value: number }>;
  }) || null;
  const snappostScore = site.snappostScore || null;
  
  // Detaylı metrikler rawSeoData'dan parse edilecek (eğer işlenmiş veri yoksa)
  let detailedMetrics: {
    pos_1?: number;
    pos_2_3?: number;
    pos_4_10?: number;
    pos_11_100?: number;
    is_new?: number;
    is_lost?: number;
    total_keywords?: number;
  } | null = null;

  // Eğer rawSeoData varsa ve işlenmiş veri yoksa, rawSeoData'dan parse et
  if (site.rawSeoData && !snappostScore) {
    try {
      const rawData = site.rawSeoData as any;
      const result = rawData.tasks?.[0]?.result?.[0];
      if (result?.items?.[0]) {
        const metrics = result.items[0]?.metrics?.organic || {};
        detailedMetrics = {
          pos_1: metrics.pos_1 || 0,
          pos_2_3: metrics.pos_2_3 || 0,
          pos_4_10: metrics.pos_4_10 || 0,
          pos_11_100: metrics.pos_11_100 || 0,
          is_new: metrics.is_new || 0,
          is_lost: metrics.is_lost || 0,
          total_keywords: metrics.count || 0
        };
      }
    } catch (error) {
      console.error("RawSeoData parse hatası:", error);
    }
  }

  const trustScore = calculateTrustScore(metrics);

  // Status badge rengi
  const getStatusBadge = (status: string) => {
    if (status === "approved") {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-green-100 text-green-700 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Onaylandı
        </span>
      );
    } else if (status === "pending") {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-yellow-100 text-yellow-700 text-sm font-medium">
          <Clock className="w-4 h-4" />
          Beklemede
        </span>
      );
    } else if (status === "rejected") {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-red-100 text-red-700 text-sm font-medium">
          <XCircle className="w-4 h-4" />
          Reddedildi
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-slate-100 text-slate-700 text-sm font-medium">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agency/inventory">
            <Button variant="ghost" size="sm" className="rounded-[2.5rem]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              Site Yönetimi
            </h1>
            <p className="mt-2 text-slate-600">{formatDomain(site.domain)}</p>
          </div>
        </div>
        {getStatusBadge(site.status)}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Snappost Score Card */}
        <Card className={`border-2 ${
          snappostScore !== null 
            ? snappostScore >= 80 ? 'border-green-300 bg-green-50' :
              snappostScore >= 60 ? 'border-indigo-300 bg-indigo-50' :
              snappostScore >= 40 ? 'border-yellow-300 bg-yellow-50' :
              'border-red-300 bg-red-50'
            : 'border-indigo-200 bg-indigo-50'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className={
                snappostScore !== null
                  ? snappostScore >= 80 ? 'text-green-700' :
                    snappostScore >= 60 ? 'text-indigo-700' :
                    snappostScore >= 40 ? 'text-yellow-700' :
                    'text-red-700'
                  : 'text-indigo-700'
              }>
                Snappost Score
              </CardDescription>
              <Shield className={`w-5 h-5 ${
                snappostScore !== null
                  ? snappostScore >= 80 ? 'text-green-600' :
                    snappostScore >= 60 ? 'text-indigo-600' :
                    snappostScore >= 40 ? 'text-yellow-600' :
                    'text-red-600'
                  : 'text-indigo-600'
              }`} />
            </div>
            <CardTitle className={`text-2xl ${
              snappostScore !== null
                ? snappostScore >= 80 ? 'text-green-700' :
                  snappostScore >= 60 ? 'text-indigo-700' :
                  snappostScore >= 40 ? 'text-yellow-700' :
                  'text-red-700'
                : 'text-indigo-700'
            }`}>
              {snappostScore !== null ? snappostScore : '-'}
            </CardTitle>
            {snappostScore !== null && (
              <p className="text-xs mt-1 text-slate-500">
                {snappostScore >= 80 ? 'Mükemmel' :
                 snappostScore >= 60 ? 'İyi' :
                 snappostScore >= 40 ? 'Orta' :
                 'Düşük'} Otorite
              </p>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Domain Authority</CardDescription>
            <CardTitle className="text-2xl">{metrics.da || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Domain Rating</CardDescription>
            <CardTitle className="text-2xl">{metrics.dr || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Spam Score</CardDescription>
            <CardTitle className="text-2xl text-red-600">{metrics.spam || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* DataForSEO Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trafik Kartı */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-blue-700">Aylık Trafik (DataForSEO)</CardDescription>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-blue-700">
              {trafficData?.estimatedTrafficValue 
                ? formatTrafficValue(trafficData.estimatedTrafficValue)
                : "-"}
            </CardTitle>
          </CardHeader>
          {trafficData?.history && trafficData.history.length > 0 && (
            <CardContent className="pt-0">
              <TrafficSparkline data={trafficData.history} />
            </CardContent>
          )}
        </Card>

        {/* Otorite Kartı - Snappost Score göster */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-purple-700">Otorite Puanı</CardDescription>
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <CardTitle className="text-2xl text-purple-700">
              {snappostScore !== null ? snappostScore : "-"}
            </CardTitle>
            <p className="text-xs text-purple-600 mt-1">
              {snappostScore !== null ? "Snappost Authority Score" : "Veri henüz çekilmedi"}
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Traffic & Metrics (Read-only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              Site Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Domain:</span>
              <span className="font-semibold">{formatDomain(site.domain)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Kategori:</span>
              <span className="font-semibold">{site.category || "Kategori Belirtilmedi"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Doğrulama Durumu:</span>
              <span className="font-semibold">{formatVerificationStatus(site.verificationStatus)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Oluşturulma:</span>
              <span className="font-semibold">
                {new Date(site.createdAt).toLocaleDateString("tr-TR")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Trafik Detayları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* DataForSEO Trafik Verisi */}
            {trafficData?.estimatedTrafficValue ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-600">DataForSEO Trafik:</span>
                  <span className="font-semibold text-indigo-600">
                    {formatTrafficValue(trafficData.estimatedTrafficValue)}
                  </span>
                </div>
                {trafficData.history && trafficData.history.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Son Güncelleme:</span>
                    <span className="font-semibold text-xs text-slate-500">
                      {site.lastSeoCheck 
                        ? new Date(site.lastSeoCheck).toLocaleDateString("tr-TR")
                        : "-"}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-slate-400 italic">
                DataForSEO verisi henüz çekilmedi. "SEO Metriklerini Yenile" butonuna tıklayın.
              </div>
            )}
            
            {/* Eski Trafik Verileri (Fallback) */}
            {(traffic.monthly || traffic.organic || traffic.referral) && (
              <>
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <p className="text-xs text-slate-500 mb-2">Manuel Trafik Verileri:</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Aylık Trafik:</span>
                  <span className="font-semibold">
                    {(traffic.monthly || 0).toLocaleString("tr-TR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Organik Trafik:</span>
                  <span className="font-semibold">
                    {(traffic.organic || 0).toLocaleString("tr-TR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Referral Trafik:</span>
                  <span className="font-semibold">
                    {(traffic.referral || 0).toLocaleString("tr-TR")}
                  </span>
                </div>
                {traffic.monthly && traffic.monthly > 0 && traffic.organic && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Organik Oranı:</span>
                    <span className="font-semibold text-indigo-600">
                      {((traffic.organic / traffic.monthly) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Management Panel */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
            <DollarSign className="w-5 h-5" />
            Yönetim Paneli
          </CardTitle>
          <CardDescription className="text-indigo-700">
            Site fiyatını ve durumunu güncelleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryDetailClient 
            site={site} 
            agencyId={agencyId}
            snappostScore={snappostScore}
            detailedMetrics={detailedMetrics}
            rawSeoData={site.rawSeoData}
            scores={{
              s_tech: site.s_tech,
              s_sem: site.s_sem,
              s_link: site.s_link,
              s_schema: site.s_schema,
              s_mon: site.s_mon,
              s_eeat: site.s_eeat,
              s_fresh: site.s_fresh,
              s_viral: site.s_viral,
              s_ux: site.s_ux,
              s_global: site.s_global,
            }}
            seoFixes={(site.seoFixes as any) || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}

