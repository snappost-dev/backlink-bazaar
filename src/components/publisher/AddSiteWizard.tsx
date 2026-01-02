"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe, Plus, DollarSign } from "lucide-react";

interface AddSiteWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { url: string; category: string; price: number }) => void;
}

export default function AddSiteWizard({ open, onOpenChange, onAdd }: AddSiteWizardProps) {
  const [formData, setFormData] = useState({
    url: "",
    category: "Technology",
    price: 150,
  });

  const categories = ["Technology", "Health", "Finance", "Lifestyle", "Business", "Education"];

  const handleSubmit = () => {
    if (!formData.url.trim()) {
      alert("Lütfen bir URL girin");
      return;
    }
    onAdd(formData);
    // Reset form
    setFormData({ url: "", category: "Technology", price: 150 });
    onOpenChange(false);
  };

  // Dinamik fiyat önerisi (kategoriye göre)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2.5rem] bg-blue-600 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>Yeni Site Ekle</DialogTitle>
              <DialogDescription>
                Sitenizi envanterinize ekleyin
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
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Kategori
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-3 rounded-[2.5rem] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            Site Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

