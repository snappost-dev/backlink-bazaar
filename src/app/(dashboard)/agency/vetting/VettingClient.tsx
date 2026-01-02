"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface VettingClientProps {
  siteId?: string;
  siteFinalPrice?: number;
}

export function VettingClient({ siteId, siteFinalPrice }: VettingClientProps = {}) {
  const [showMasked, setShowMasked] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!siteId) return;

    setIsApproving(true);
    try {
      const response = await fetch("/api/sites/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId,
          finalPrice: siteFinalPrice,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Site onaylanamadı");
      }

      alert("Site başarıyla onaylandı!");
      // Sayfayı yenile
      window.location.reload();
    } catch (error: any) {
      console.error("Approve error:", error);
      alert(`Hata: ${error.message || "Site onaylanamadı"}`);
    } finally {
      setIsApproving(false);
    }
  };

  // Eğer siteId yoksa, sadece mask toggle butonu göster
  if (!siteId) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMasked(!showMasked)}
        className="rounded-[2.5rem]"
      >
        {showMasked ? (
          <>
            <EyeOff className="w-4 h-4 mr-2" />
            Maskeyi Kaldır
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            URL'leri Gizle
          </>
        )}
      </Button>
    );
  }

  // SiteId varsa, onayla butonu göster
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleApprove}
        disabled={isApproving}
        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 disabled:opacity-50"
      >
        {isApproving ? "Onaylanıyor..." : "Onayla"}
      </Button>
    </>
  );
}

