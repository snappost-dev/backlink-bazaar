import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, TrendingUp, Shield, Database, AlertCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatDomain } from "@/lib/utils";
import { VettingDetailClient } from "./VettingDetailClient";
import Link from "next/link";

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

export default async function VettingDetailPage({ params }: { params: { id: string } }) {
  const siteId = params.id;

  // Site'i veritabanından çek
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

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
            <Link href="/agency/vetting">
              <Button variant="outline">Vetting Pool'a Dön</Button>
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

  const trustScore = calculateTrustScore(metrics);

  // Mock traffic data (gerçek uygulamada history tablosundan gelecek)
  const trafficData = [
    { month: "Oca", traffic: traffic.monthly || 0, organic: traffic.organic || 0 },
    { month: "Şub", traffic: (traffic.monthly || 0) * 1.1, organic: (traffic.organic || 0) * 1.1 },
    { month: "Mar", traffic: (traffic.monthly || 0) * 1.2, organic: (traffic.organic || 0) * 1.2 },
    { month: "Nis", traffic: (traffic.monthly || 0) * 1.15, organic: (traffic.organic || 0) * 1.15 },
    { month: "May", traffic: (traffic.monthly || 0) * 1.3, organic: (traffic.organic || 0) * 1.3 },
    { month: "Haz", traffic: (traffic.monthly || 0) * 1.25, organic: (traffic.organic || 0) * 1.25 },
    { month: "Tem", traffic: (traffic.monthly || 0) * 1.35, organic: (traffic.organic || 0) * 1.35 },
    { month: "Ağu", traffic: (traffic.monthly || 0) * 1.4, organic: (traffic.organic || 0) * 1.4 },
    { month: "Eyl", traffic: (traffic.monthly || 0) * 1.2, organic: (traffic.organic || 0) * 1.2 },
    { month: "Eki", traffic: (traffic.monthly || 0) * 1.25, organic: (traffic.organic || 0) * 1.25 },
    { month: "Kas", traffic: (traffic.monthly || 0) * 1.3, organic: (traffic.organic || 0) * 1.3 },
    { month: "Ara", traffic: traffic.monthly || 0, organic: traffic.organic || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agency/vetting">
            <Button variant="ghost" size="sm" className="rounded-[2.5rem]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              Deep Insight
            </h1>
            <p className="mt-2 text-slate-600">{formatDomain(site.domain)}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-indigo-700">Trust Score</CardDescription>
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl text-indigo-700">{trustScore}</CardTitle>
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

      {/* Traffic Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Trafik Grafiği (Son 12 Ay)</CardTitle>
              <CardDescription>
                Aylık ziyaretçi sayısı ve organik trafik trendi
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-[2.5rem] bg-indigo-100 text-indigo-700 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5%</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VettingDetailClient trafficData={trafficData} />
        </CardContent>
      </Card>

      {/* Site Details */}
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
              <span className="text-slate-600">Durum:</span>
              <span className="font-semibold text-green-600">{site.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Doğrulama Tarihi:</span>
              <span className="font-semibold">
                {site.verifiedAt ? new Date(site.verifiedAt).toLocaleDateString("tr-TR") : "Henüz doğrulanmadı"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Trafik Detayları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
