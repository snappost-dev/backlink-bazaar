"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

interface Site {
  id: string;
  domain: string;
  basePrice: number;
  finalPrice: number;
  status: string;
}

interface InventoryDetailClientProps {
  site: Site;
}

export function InventoryDetailClient({ site }: InventoryDetailClientProps) {
  const [basePrice, setBasePrice] = useState(site.basePrice);
  const [status, setStatus] = useState(site.status);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Final price hesaplama (30% marj)
  const calculatedFinalPrice = basePrice * 1.3;

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/sites/${site.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          basePrice: Number(basePrice),
          status: status,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Site güncellenemedi");
      }

      setMessage({ type: "success", text: "Değişiklikler başarıyla kaydedildi!" });
      
      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Update error:", error);
      setMessage({ type: "error", text: error.message || "Site güncellenemedi" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Base Price Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Base Price (USD)
        </label>
        <input
          type="number"
          value={basePrice}
          onChange={(e) => setBasePrice(Number(e.target.value))}
          min="0"
          step="10"
          className="w-full px-4 py-3 rounded-[2.5rem] border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
        <p className="text-xs text-slate-500 mt-1">
          Final Price (30% marj): <span className="font-semibold text-indigo-600">${calculatedFinalPrice.toFixed(2)}</span>
        </p>
      </div>

      {/* Status Select */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Durum
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-3 rounded-[2.5rem] border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="pending">Beklemede (PENDING)</option>
          <option value="approved">Onaylandı (APPROVED)</option>
          <option value="rejected">Reddedildi (REJECTED)</option>
        </select>
        <p className="text-xs text-slate-500 mt-1">
          APPROVED siteler marketplace'te görünür
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-[2.5rem] ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-indigo-200">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-[2.5rem]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Değişiklikleri Kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

