import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Clock, XCircle, Shield } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatDomain, formatPrice, formatVerificationStatus } from "@/lib/utils";
import Link from "next/link";
import { InventoryDetailClient } from "./InventoryDetailClient";

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
          <InventoryDetailClient site={site} />
        </CardContent>
      </Card>
    </div>
  );
}

