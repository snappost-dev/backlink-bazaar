"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe, Plus, DollarSign, Loader2, Lock } from "lucide-react";

interface AddPrivateSiteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { url: string; category: string; price: number; domain: string }) => void;
}

export default function AddPrivateSiteModal({ open, onOpenChange, onAdd }: AddPrivateSiteModalProps) {
  const [formData, setFormData] = useState({
    url: "",
    category: "Technology",
    price: 150,
    domain: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<{
    title?: string;
    description?: string;
    domain?: string;
  } | null>(null);

  const categories = ["Technology", "Health", "Finance", "Lifestyle", "Business", "Education"];

  // Dinamik fiyat önerisi
  const getPriceSuggestion = (category: string) => {
    const suggestions: Record<string, number> = {
      Technology: 150,
      Health: 200,
      Finance: 300,
      Lifestyle: 120,
      Business: 250,
      Education: 180,
    };
    return suggestions[category] || 150;
  };

  const handleCategoryChange = (category: string) => {
    setFormData({
      ...formData,
      category,
      price: getPriceSuggestion(category),
    });
  };

  // Crawler API'ye istek at
  const handleAnalyzeUrl = async () => {
    if (!formData.url.trim()) {
      alert("Lütfen bir URL girin");
      return;
    }

    setIsAnalyzing(true);
    setAnalyzedData(null);

    try {
      const response = await fetch("/api/sites/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: formData.url }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Site analiz edilemedi");
      }

      // Formu doldur
      setFormData({
        ...formData,
        domain: result.data.domain,
        category: result.data.inferredCategory,
        price: getPriceSuggestion(result.data.inferredCategory),
      });

      setAnalyzedData({
        title: result.data.title,
        description: result.data.description,
        domain: result.data.domain,
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      alert(`Analiz hatası: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.url.trim()) {
      alert("Lütfen bir URL girin");
      return;
    }

    if (!formData.domain) {
      alert("Lütfen önce URL'yi analiz edin");
      return;
    }

    // API'ye kaydet (Agency Portfolio, UNVERIFIED, isPrivate: true)
    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formData.url,
          domain: formData.domain,
          category: formData.category,
          basePrice: formData.price,
          finalPrice: formData.price * 1.3, // 30% agency markup
          origin: "AGENCY_PORTFOLIO",
          verificationStatus: "UNVERIFIED",
          isPrivate: true,
          agencyId: "agency@blue-seo.com", // TODO: Auth'dan alınacak
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Site eklenemedi");
      }

      onAdd(formData);
      // Reset form
      setFormData({ url: "", category: "Technology", price: 150, domain: "" });
      setAnalyzedData(null);
      onOpenChange(false);
      alert("Site portföyünüze eklendi!");
    } catch (error: any) {
      console.error("Site creation error:", error);
      alert(`Hata: ${error.message || "Site eklenemedi"}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>Özel Portföy Ekle</DialogTitle>
              <DialogDescription>
                Ajans portföyünüze özel site ekleyin (Doğrulama gerekmez)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Site URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                className="flex-1 px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onBlur={handleAnalyzeUrl}
              />
              <Button
                type="button"
                onClick={handleAnalyzeUrl}
                disabled={isAnalyzing || !formData.url.trim()}
                className="rounded-[2.5rem] bg-indigo-600 hover:bg-indigo-700"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Analiz Et"
                )}
              </Button>
            </div>
            {analyzedData && (
              <div className="mt-2 p-3 rounded-[2.5rem] bg-indigo-50 border border-indigo-200">
                <p className="text-sm font-semibold text-indigo-900">{analyzedData.title}</p>
                <p className="text-xs text-indigo-700 mt-1">{analyzedData.description}</p>
                <p className="text-xs text-indigo-600 mt-1">Domain: {analyzedData.domain}</p>
              </div>
            )}
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Kategori
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Fiyat (USD)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
              min="0"
              step="10"
              className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Önerilen: ${getPriceSuggestion(formData.category)} (kategori bazlı)
            </p>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
            Portföye Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}






