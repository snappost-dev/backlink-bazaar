"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface VerificationClientProps {
  snippet: string;
}

export function VerificationClient({ snippet }: VerificationClientProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    alert("Kod kopyalandı!");
  };

  return (
    <div className="relative">
      <pre className="p-4 bg-slate-900 text-slate-100 rounded-[2.5rem] text-sm overflow-x-auto">
        <code>{snippet}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2"
        onClick={handleCopy}
      >
        <Copy className="w-4 h-4 mr-2" />
        Kopyala
      </Button>
    </div>
  );
}

