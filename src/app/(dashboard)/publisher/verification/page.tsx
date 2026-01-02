import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Code, Copy, AlertCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatDomain, formatVerificationStatus } from "@/lib/utils";
import { VerificationClient } from "./VerificationClient";

export const dynamic = 'force-dynamic';

export default async function VerificationPage() {
  // Publisher'ın sitelerini çek
  const sites = await prisma.site.findMany({
    where: {
      origin: "PUBLISHER_OWNED",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

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
          <VerificationClient snippet={verificationSnippet} />
        </CardContent>
      </Card>

      {/* Empty State */}
      {sites.length === 0 ? (
        <Card className="border-dashed border-2 border-blue-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Henüz site eklemediniz
            </h3>
            <p className="text-sm text-slate-600 text-center max-w-md">
              Doğrulamak için önce envanterinize site eklemeniz gerekiyor.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Sites Verification Status */
        <div className="grid grid-cols-1 gap-4">
          {sites.map((site: typeof sites[0]) => {
            return (
              <Card key={site.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{formatDomain(site.domain)}</CardTitle>
                      <CardDescription className="mt-1">
                        {site.category || "Kategori Belirtilmedi"}
                      </CardDescription>
                    </div>
                    {site.verificationStatus === "VERIFIED" ? (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-green-100 text-green-700 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        {formatVerificationStatus(site.verificationStatus)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-[2.5rem] bg-yellow-100 text-yellow-700 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        {formatVerificationStatus(site.verificationStatus)}
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
                      {site.verificationStatus === "VERIFIED" ? "Yeniden Doğrula" : "Doğrula"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
