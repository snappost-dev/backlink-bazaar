"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Globe, TrendingUp, Filter } from "lucide-react";
import { MOCK_SITES } from "@/lib/mock-data";
import { useState } from "react";
import BriefingWizard from "@/components/buyer/BriefingWizard";

// Legacy Briefing Wizard Modal Component (deprecated - will be removed)
function BriefingWizardModal({ 
  isOpen, 
  onClose, 
  site 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  site: typeof MOCK_SITES[0] | null;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    targetUrl: "",
    anchorText: "",
    placement: "content",
    instructions: "",
    deadline: "",
  });

  if (!isOpen || !site) return null;

  const handleSubmit = () => {
    // Mock: Sipariş gönder
    console.log("Briefing submitted:", { site, formData });
    alert("Sipariş başarıyla oluşturuldu!");
    onClose();
    setStep(1);
    setFormData({
      targetUrl: "",
      anchorText: "",
      placement: "content",
      instructions: "",
      deadline: "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] m-4">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2.5rem] bg-slate-900 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Briefing Wizard</CardTitle>
              <CardDescription>{site.domain}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? "bg-slate-900 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Target URL & Anchor */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Link2 className="w-4 h-4 inline mr-2" />
                  Hedef URL
                </label>
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  placeholder="https://example.com/target-page"
                  className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Anchor Text
                </label>
                <input
                  type="text"
                  value={formData.anchorText}
                  onChange={(e) => setFormData({ ...formData, anchorText: e.target.value })}
                  placeholder="Örnek: En İyi SEO Araçları"
                  className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          )}

          {/* Step 2: Placement & Instructions */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Yerleşim Türü
                </label>
                <select
                  value={formData.placement}
                  onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                  className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="content">Yazı İçi (Content)</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="footer">Footer</option>
                  <option value="author-bio">Yazar Bio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Özel Talimatlar
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Yayıncıya özel talimatlarınızı buraya yazın..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          )}

          {/* Step 3: Deadline & Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Teslim Tarihi
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Sipariş Özeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Site:</span>
                    <span className="font-semibold">{site.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Hedef URL:</span>
                    <span className="font-semibold truncate max-w-xs">{formData.targetUrl || "Belirtilmedi"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Anchor:</span>
                    <span className="font-semibold">{formData.anchorText || "Belirtilmedi"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fiyat:</span>
                    <span className="font-semibold text-slate-900">${site.finalPrice}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="rounded-[2.5rem]"
            >
              {step > 1 ? "Geri" : "İptal"}
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="rounded-[2.5rem] bg-slate-900 hover:bg-slate-800"
              >
                İleri
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="rounded-[2.5rem] bg-slate-900 hover:bg-slate-800"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Siparişi Tamamla
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MarketplacePage() {
  const [selectedSite, setSelectedSite] = useState<typeof MOCK_SITES[0] | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
            Marketplace
          </h1>
          <p className="mt-2 text-slate-600">
            Doğrulanmış sitelerden backlink satın alın
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filtrele
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Site</CardDescription>
            <CardTitle className="text-2xl">
              {MOCK_SITES.filter((s) => s.status === "verified").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ortalama Fiyat</CardDescription>
            <CardTitle className="text-2xl">
              ${Math.round(
                MOCK_SITES.filter((s) => s.status === "verified")
                  .reduce((acc, s) => acc + s.finalPrice, 0) /
                  MOCK_SITES.filter((s) => s.status === "verified").length
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Kategoriler</CardDescription>
            <CardTitle className="text-2xl">
              {new Set(MOCK_SITES.map((s) => s.category)).size}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_SITES.filter((s) => s.status === "verified").map((site) => (
          <Card key={site.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[2.5rem] bg-slate-900 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{site.domain}</CardTitle>
                    <CardDescription className="mt-1">{site.category}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">DA / DR</span>
                  <span className="font-semibold">
                    {site.metrics.da} / {site.metrics.dr}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Aylık Trafik</span>
                  <span className="font-semibold">
                    {site.traffic.monthly.toLocaleString("tr-TR")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Spam Skoru</span>
                  <span className="font-semibold">{site.metrics.spam}</span>
                </div>
              </div>

              {/* Price */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-600">Fiyat</span>
                  <span className="text-2xl font-black text-slate-900">
                    ${site.finalPrice}
                  </span>
                </div>
                <Button 
                  className="w-full rounded-[2.5rem] bg-slate-900 hover:bg-slate-800"
                  onClick={() => {
                    setSelectedSite(site);
                    setIsWizardOpen(true);
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Sipariş Ver
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Briefing Wizard Modal */}
      <BriefingWizard
        open={isWizardOpen}
        onOpenChange={(open) => {
          setIsWizardOpen(open);
          if (!open) setSelectedSite(null);
        }}
        site={selectedSite}
      />
    </div>
  );
}

