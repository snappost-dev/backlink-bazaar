"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, TrendingUp, Shield, Database } from "lucide-react";
import { MOCK_SITES } from "@/lib/mock-data";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function VettingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  // Mock: Site verisini bul
  const site = MOCK_SITES.find((s) => s.id === siteId) || MOCK_SITES[0];

  // Mock: Trafik verisi (son 12 ay)
  const trafficData = [
    { month: "Oca", traffic: 38000, organic: 32000 },
    { month: "Şub", traffic: 42000, organic: 35000 },
    { month: "Mar", traffic: 45000, organic: 38000 },
    { month: "Nis", traffic: 48000, organic: 40000 },
    { month: "May", traffic: 52000, organic: 43000 },
    { month: "Haz", traffic: 49000, organic: 41000 },
    { month: "Tem", traffic: 51000, organic: 42000 },
    { month: "Ağu", traffic: 54000, organic: 45000 },
    { month: "Eyl", traffic: 47000, organic: 39000 },
    { month: "Eki", traffic: 50000, organic: 41000 },
    { month: "Kas", traffic: 53000, organic: 44000 },
    { month: "Ara", traffic: 45000, organic: 38000 },
  ];

  // Trust Score hesaplama
  const calculateTrustScore = (metrics: { da: number; dr: number; spam: number }): number => {
    const daScore = metrics.da * 1.2;
    const drScore = metrics.dr * 1.0;
    const spamPenalty = metrics.spam * 10;
    const score = Math.min(100, Math.max(0, (daScore + drScore) - spamPenalty));
    return Math.round(score);
  };

  const trustScore = calculateTrustScore(site.metrics);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/agency/vetting")}
            className="rounded-[2.5rem]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              Deep Insight
            </h1>
            <p className="mt-2 text-slate-600">{site.domain}</p>
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
            <CardTitle className="text-2xl">{site.metrics.da}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Domain Rating</CardDescription>
            <CardTitle className="text-2xl">{site.metrics.dr}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Spam Score</CardDescription>
            <CardTitle className="text-2xl text-red-600">{site.metrics.spam}</CardTitle>
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
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "1rem",
                  padding: "8px 12px",
                }}
                formatter={(value: number) => value.toLocaleString("tr-TR")}
              />
              <Area
                type="monotone"
                dataKey="traffic"
                stroke="#4f46e5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTraffic)"
                name="Toplam Trafik"
              />
              <Area
                type="monotone"
                dataKey="organic"
                stroke="#818cf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOrganic)"
                name="Organik Trafik"
              />
            </AreaChart>
          </ResponsiveContainer>
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
              <span className="font-semibold">{site.domain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Kategori:</span>
              <span className="font-semibold">{site.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Durum:</span>
              <span className="font-semibold text-green-600">{site.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Doğrulama Tarihi:</span>
              <span className="font-semibold">
                {site.verifiedAt || "Henüz doğrulanmadı"}
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
                {site.traffic.monthly.toLocaleString("tr-TR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Organik Trafik:</span>
              <span className="font-semibold">
                {site.traffic.organic.toLocaleString("tr-TR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Referral Trafik:</span>
              <span className="font-semibold">
                {site.traffic.referral.toLocaleString("tr-TR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Organik Oranı:</span>
              <span className="font-semibold text-indigo-600">
                {((site.traffic.organic / site.traffic.monthly) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

