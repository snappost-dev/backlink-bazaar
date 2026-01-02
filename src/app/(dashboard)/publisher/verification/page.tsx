"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, Code, Copy } from "lucide-react";
import { MOCK_SITES } from "@/lib/mock-data";

export default function VerificationPage() {
  const verificationSnippet = `<!-- Backlink Bazaar Verification -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://exchange.snappost.app/verify.js';
    script.setAttribute('data-site-id', 'YOUR_SITE_ID');
    document.head.appendChild(script);
  })();
</script>`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
          Doğrulama Hub
        </h1>
        <p className="mt-2 text-slate-600">
          Sitelerinizi doğrulayın ve marketplace'te yayınlayın
        </p>
      </div>

      {/* Verification Snippet Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Doğrulama Kodu
          </CardTitle>
          <CardDescription>
            Bu kodu sitenizin &lt;head&gt; bölümüne ekleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-[2.5rem] text-sm overflow-x-auto">
              <code>{verificationSnippet}</code>
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => navigator.clipboard.writeText(verificationSnippet)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Kopyala
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sites Verification Status */}
      <div className="grid grid-cols-1 gap-4">
        {MOCK_SITES.map((site) => (
          <Card key={site.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{site.domain}</CardTitle>
                  <CardDescription className="mt-1">{site.category}</CardDescription>
                </div>
                {site.status === "verified" ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-green-100 text-green-700 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Doğrulanmış
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-yellow-100 text-yellow-700 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Beklemede
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  {site.verifiedAt ? (
                    <p className="text-sm text-slate-600">
                      Doğrulandı: {new Date(site.verifiedAt).toLocaleDateString("tr-TR")}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Doğrulama kodu eklenmeyi bekliyor
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  {site.status === "verified" ? "Yeniden Doğrula" : "Doğrula"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

