"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import BriefingWizard from "@/components/buyer/BriefingWizard";

interface MarketplaceClientProps {
  site: {
    id: string;
    domain: string;
    category: string;
    finalPrice: number;
    metrics: any;
    traffic: any;
  };
}

export function MarketplaceClient({ site }: MarketplaceClientProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Convert Prisma site to BriefingWizard format
  const wizardSite = {
    id: site.id,
    domain: site.domain,
    category: site.category,
    finalPrice: site.finalPrice,
    metrics: site.metrics,
    traffic: site.traffic,
    status: "verified", // Default for marketplace
  };

  return (
    <>
      <Button
        className="w-full rounded-[2.5rem] bg-slate-900 hover:bg-slate-800"
        onClick={() => setIsWizardOpen(true)}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Sipariş Ver
      </Button>
      <BriefingWizard
        open={isWizardOpen}
        onOpenChange={(open) => {
          setIsWizardOpen(open);
        }}
        site={wizardSite}
      />
    </>
  );
}

