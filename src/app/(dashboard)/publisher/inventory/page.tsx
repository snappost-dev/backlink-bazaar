"use client";

import { useState } from "react";
import { MOCK_SITES } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, CheckCircle2, Clock, TrendingUp, Plus } from "lucide-react";
import AddSiteWizard from "@/components/publisher/AddSiteWizard";

export default function InventoryPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleAddSite = (data: { url: string; category: string; price: number }) => {
    // Mock: Site ekleme
    console.log("New site added:", data);
    alert(`Site başarıyla eklendi: ${data.url}`);
  };
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
        <Button
          onClick={() => setIsWizardOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Site Ekle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Site</CardDescription>
            <CardTitle className="text-2xl">{MOCK_SITES.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Doğrulanmış</CardDescription>
            <CardTitle className="text-2xl">
              {MOCK_SITES.filter((s) => s.status === "verified").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Beklemede</CardDescription>
            <CardTitle className="text-2xl">
              {MOCK_SITES.filter((s) => s.status === "pending").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ortalama Fiyat</CardDescription>
            <CardTitle className="text-2xl">
              ${Math.round(
                MOCK_SITES.reduce((acc, s) => acc + s.finalPrice, 0) /
                  MOCK_SITES.length
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sites List */}
      <div className="grid grid-cols-1 gap-4">
        {MOCK_SITES.map((site) => (
          <Card key={site.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[2.5rem] bg-blue-100 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{site.domain}</CardTitle>
                    <CardDescription className="mt-1">
                      {site.category} • DA: {site.metrics.da} • DR:{" "}
                      {site.metrics.dr}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {site.status === "verified" ? (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-green-100 text-green-700 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Doğrulanmış
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-yellow-100 text-yellow-700 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Beklemede
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
                        {site.traffic.monthly.toLocaleString()}
                      </span>{" "}
                      aylık ziyaretçi
                    </p>
                    <p className="text-xs text-slate-500">
                      {site.traffic.organic.toLocaleString()} organik
                    </p>
                  </div>
                </div>

                {/* Pricing Info */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-600">
                    Fiyatlandırma
                  </div>
                  <div className="pl-6 space-y-1">
                    <p className="text-sm">
                      <span className="font-semibold text-blue-600">
                        ${site.finalPrice}
                      </span>{" "}
                      / bağlantı
                    </p>
                    <p className="text-xs text-slate-500">
                      Base: ${site.basePrice}
                    </p>
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
        ))}
      </div>

      {/* Add Site Wizard */}
      <AddSiteWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onAdd={handleAddSite}
      />
    </div>
  );
}

