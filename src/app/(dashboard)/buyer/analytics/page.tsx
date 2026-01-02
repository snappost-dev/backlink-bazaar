"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart, DollarSign } from "lucide-react";

export default function BuyerAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
          Buyer Analitik
        </h1>
        <p className="mt-2 text-slate-600">
          Satın alma istatistiklerinizi görüntüleyin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Sipariş</CardDescription>
            <CardTitle className="text-2xl">8</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Harcama</CardDescription>
            <CardTitle className="text-2xl">$1,240</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ortalama Fiyat</CardDescription>
            <CardTitle className="text-2xl">$155</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

