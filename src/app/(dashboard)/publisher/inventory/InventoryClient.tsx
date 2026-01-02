"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddSiteWizard from "@/components/publisher/AddSiteWizard";

export function InventoryClient() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleAddSite = (data: { url: string; category: string; price: number; domain: string }) => {
    // Sayfayı yenile
    window.location.reload();
  };

  return (
    <>
      <Button
        onClick={() => setIsWizardOpen(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Yeni Site Ekle
      </Button>
      <AddSiteWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onAdd={handleAddSite}
      />
    </>
  );
}

