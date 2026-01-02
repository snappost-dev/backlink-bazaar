"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Wand2, FileText, Database, Sparkles, ShoppingCart } from "lucide-react";
import { MOCK_SITES } from "@/lib/mock-data";

interface BriefingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: typeof MOCK_SITES[0] | null;
}

export default function BriefingWizard({ open, onOpenChange, site }: BriefingWizardProps) {
  const [activeTab, setActiveTab] = useState("text");
  const [formData, setFormData] = useState({
    readyText: "",
    rawData: "",
    aiInstruction: "",
    targetUrl: "",
    anchorText: "",
    deadline: "",
  });

  if (!site) return null;

  const handleSubmit = () => {
    console.log("Briefing submitted:", { site, formData });
    alert("Sipariş başarıyla oluşturuldu!");
    onOpenChange(false);
    // Reset
    setActiveTab("text");
    setFormData({
      readyText: "",
      rawData: "",
      aiInstruction: "",
      targetUrl: "",
      anchorText: "",
      deadline: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2.5rem] bg-slate-900 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>Briefing Wizard (The Briefcase)</DialogTitle>
              <DialogDescription>{site.domain}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogBody>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="text">
                <FileText className="w-4 h-4 mr-2" />
                Hazır Metin
              </TabsTrigger>
              <TabsTrigger value="data">
                <Database className="w-4 h-4 mr-2" />
                Ham Veri
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Talimatı
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Hazır Metin */}
            <TabsContent value="text" className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hazır Metin (Yayıncı doğrudan kullanabilir)
                </label>
                <textarea
                  value={formData.readyText}
                  onChange={(e) => setFormData({ ...formData, readyText: e.target.value })}
                  placeholder="Backlink için hazır metin içeriğinizi buraya yapıştırın..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Bu metin yayıncıya doğrudan gönderilecek ve içerik olarak kullanılacak.
                </p>
              </div>
            </TabsContent>

            {/* Tab 2: Ham Veri */}
            <TabsContent value="data" className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ham Veri (JSON, CSV veya düz metin)
                </label>
                <textarea
                  value={formData.rawData}
                  onChange={(e) => setFormData({ ...formData, rawData: e.target.value })}
                  placeholder='Örnek JSON: {"products": [{"name": "Ürün 1", "price": 100}]}'
                  rows={8}
                  className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Yapılandırılmış verilerinizi buraya yapıştırın. Yayıncı bu veriyi içeriğe dönüştürecek.
                </p>
              </div>
            </TabsContent>

            {/* Tab 3: AI Talimatı */}
            <TabsContent value="ai" className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  AI Talimatı (Yayıncıya yönelik)
                </label>
                <textarea
                  value={formData.aiInstruction}
                  onChange={(e) => setFormData({ ...formData, aiInstruction: e.target.value })}
                  placeholder="Örnek: 'Teknoloji odaklı, 500 kelimelik bir blog yazısı oluştur. SEO dostu, doğal dil kullan...'"
                  rows={8}
                  className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Yayıncıya içerik oluşturması için detaylı talimatlar verin.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Ortak Alanlar */}
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hedef URL
                </label>
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  placeholder="https://example.com/target"
                  className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Teslim Tarihi
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} className="bg-slate-900 hover:bg-slate-800">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Siparişi Tamamla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

