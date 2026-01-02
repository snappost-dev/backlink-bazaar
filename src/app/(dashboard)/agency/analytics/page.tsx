"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Database } from "lucide-react";

export default function AgencyAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
          Agency Analitik
        </h1>
        <p className="mt-2 text-slate-600">
          Ajans performans metriklerinizi görüntüleyin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Site</CardDescription>
            <CardTitle className="text-2xl">12</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Gelir</CardDescription>
            <CardTitle className="text-2xl">$2,450</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Aktif Sipariş</CardDescription>
            <CardTitle className="text-2xl">5</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Onay Oranı</CardDescription>
            <CardTitle className="text-2xl">85%</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

