"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Lock, Plus, Database } from "lucide-react";
import AddPrivateSiteModal from "@/components/agency/AddPrivateSiteModal";

export default function AgencyInventoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock: Agency private sites
  const mockPrivateSites = [
    {
      id: "private-1",
      domain: "example-portfolio.com",
      category: "Technology",
      status: "unverified",
      isPrivate: true,
      origin: "AGENCY_PORTFOLIO",
    },
  ];

  const handleAddSite = (data: { url: string; category: string; price: number; domain: string }) => {
    console.log("Private site added:", data);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
            Özel Portföy
          </h1>
          <p className="mt-2 text-slate-600">
            Ajans portföyünüze özel siteler ekleyin (Doğrulama gerekmez)
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Özel Site Ekle
        </Button>
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

      {/* Private Sites List */}
      <div className="grid grid-cols-1 gap-4">
        {mockPrivateSites.map((site) => (
          <Card key={site.id} className="border-indigo-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[2.5rem] bg-indigo-100 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{site.domain}</CardTitle>
                    <CardDescription className="mt-1">
                      {site.category} • {site.origin}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-indigo-100 text-indigo-700 text-sm font-medium">
                    <Lock className="w-4 h-4" />
                    Özel
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Durum: <span className="font-semibold text-slate-900">Doğrulanmamış</span>
                </div>
                <Button variant="outline" size="sm">
                  Detaylar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Private Site Modal */}
      <AddPrivateSiteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAdd={handleAddSite}
      />
    </div>
  );
}

