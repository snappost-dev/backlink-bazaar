"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Search, CheckCircle2, XCircle, Clock, TrendingUp, Shield, Eye, EyeOff } from "lucide-react";
import { MOCK_SITES } from "@/lib/mock-data";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Maskelenmiş URL fonksiyonu
const maskUrl = (domain: string): string => {
  const parts = domain.split(".");
  if (parts.length >= 2) {
    const subdomain = parts[0];
    const maskedSubdomain = subdomain.length > 3 
      ? subdomain.substring(0, 2) + "***" 
      : "***";
    return `${maskedSubdomain}.${parts.slice(1).join(".")}`;
  }
  return domain;
};

// Trust Score hesaplama (0-100)
const calculateTrustScore = (metrics: { da: number; dr: number; spam: number }): number => {
  const daScore = metrics.da * 1.2; // DA ağırlığı
  const drScore = metrics.dr * 1.0; // DR ağırlığı
  const spamPenalty = metrics.spam * 10; // Spam cezası
  const score = Math.min(100, Math.max(0, (daScore + drScore) - spamPenalty));
  return Math.round(score);
};

export default function VettingPage() {
  const [showMasked, setShowMasked] = useState(true);
  const router = useRouter();

  const mockVettingQueue = [
    { ...MOCK_SITES[0], status: "approved", reviewedAt: "2024-03-15" },
    { ...MOCK_SITES[1], status: "pending", reviewedAt: null },
    { ...MOCK_SITES[2], status: "rejected", reviewedAt: "2024-03-10", reason: "Spam skoru yüksek" },
  ].map((site) => ({
    ...site,
    maskedUrl: maskUrl(site.domain),
    trustScore: calculateTrustScore(site.metrics),
  }));

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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMasked(!showMasked)}
          className="rounded-[2.5rem]"
        >
          {showMasked ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Maskeyi Kaldır
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              URL'leri Gizle
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Site</CardDescription>
            <CardTitle className="text-2xl">{mockVettingQueue.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Onaylanan</CardDescription>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              {mockVettingQueue.filter((s) => s.status === "approved").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Beklemede</CardDescription>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-600">
              {mockVettingQueue.filter((s) => s.status === "pending").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Reddedilen</CardDescription>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">
              {mockVettingQueue.filter((s) => s.status === "rejected").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Vetting Queue */}
      <div className="grid grid-cols-1 gap-4">
        {mockVettingQueue.map((site) => (
          <Card
            key={site.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/agency/vetting/${site.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">
                      {showMasked ? site.maskedUrl : site.domain}
                    </CardTitle>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-[2.5rem] bg-indigo-100 text-indigo-700">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        Trust: {site.trustScore}
                      </span>
                    </div>
                  </div>
                  <CardDescription className="mt-1">
                    {site.category} • DA: {site.metrics.da} • DR: {site.metrics.dr} • Spam: {site.metrics.spam}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {site.status === "approved" && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-green-100 text-green-700 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Onaylandı
                    </span>
                  )}
                  {site.status === "pending" && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-yellow-100 text-yellow-700 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Beklemede
                    </span>
                  )}
                  {site.status === "rejected" && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-red-100 text-red-700 text-sm font-medium">
                      <XCircle className="w-4 h-4" />
                      Reddedildi
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Metrics */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-600">Metrikler</div>
                  <div className="pl-6 space-y-1">
                    <p className="text-sm">
                      Trafik: <span className="font-semibold">{site.traffic.monthly.toLocaleString("tr-TR")}</span>
                    </p>
                    <p className="text-sm">
                      Organik: <span className="font-semibold">{site.traffic.organic.toLocaleString("tr-TR")}</span>
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-600">Fiyatlandırma</div>
                  <div className="pl-6 space-y-1">
                    <p className="text-sm">
                      Base: <span className="font-semibold">${site.basePrice}</span>
                    </p>
                    <p className="text-sm">
                      Final: <span className="font-semibold text-indigo-600">${site.finalPrice}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-end justify-end gap-2">
                  {site.status === "pending" && (
                    <>
                      <Button variant="outline" size="sm" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                        Onayla
                      </Button>
                      <Button variant="outline" size="sm" className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100">
                        Reddet
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/agency/vetting/${site.id}`)}
                  >
                    Detaylar
                  </Button>
                </div>
              </div>
              {site.status === "rejected" && site.reason && (
                <div className="mt-4 p-3 rounded-[2.5rem] bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700">
                    <strong>Red Nedeni:</strong> {site.reason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

