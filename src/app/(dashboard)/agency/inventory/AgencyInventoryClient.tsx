"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddPrivateSiteModal from "@/components/agency/AddPrivateSiteModal";

export function AgencyInventoryClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddSite = (data: { url: string; category: string; price: number; domain: string }) => {
    // Sayfayı yenile
    window.location.reload();
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Özel Site Ekle
      </Button>
      <AddPrivateSiteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAdd={handleAddSite}
      />
    </>
  );
}

