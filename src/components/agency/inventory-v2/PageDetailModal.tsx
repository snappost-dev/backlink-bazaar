"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle, Zap, DollarSign, RefreshCw, Code, Shield, TrendingUp } from "lucide-react";
import type { LocalAuditResponse, SeoFix } from "@/lib/types/seo";

interface PageDetailModalProps {
  pageUrl: string;
  agencyId: string;
  agencyCredits: number;
  onClose: () => void;
}

export function PageDetailModal({
  pageUrl,
  agencyId,
  agencyCredits,
  onClose,
}: PageDetailModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    localAudit: LocalAuditResponse | null;
    pageScore: number | null;
    pageFixes: SeoFix[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (agencyCredits < 1) {
      setError("Yeterli krediniz yok. Bu analiz 1 kredi harcar.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // TODO: API endpoint oluşturulacak - analyzePageAction
      // Şimdilik mock response
      const response = await fetch('/api/sites/analyze-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl,
          agencyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Analiz başarısız oldu');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Sayfa Detaylı Analizi</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            {pageUrl}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Kredi Uyarısı */}
          {agencyCredits < 1 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-semibold text-red-900">
                  Yeterli krediniz yok. Bu analiz 1 kredi harcar.
                </p>
              </div>
            </div>
          )}

          {/* Analiz Başlatma Butonu */}
          {!analysisResult && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-purple-900 mb-2">
                    CF Worker Page-Level Analizi
                  </h3>
                  <p className="text-sm text-purple-700">
                    Bu sayfa için detaylı SEO analizi yapılacak. Analiz 1 kredi harcar ve şu bilgileri içerir:
                  </p>
                  <ul className="list-disc list-inside text-sm text-purple-700 mt-2 space-y-1">
                    <li>Meta Tags (title, description, H1, H2)</li>
                    <li>Schema Markup</li>
                    <li>Performance Metrics</li>
                    <li>Page-specific SEO Fixes</li>
                  </ul>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || agencyCredits < 1}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-[2.5rem]"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analiz Ediliyor...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analiz Et (1 Kredi)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Hata Mesajı */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-semibold text-red-900">{error}</p>
              </div>
            </div>
          )}

          {/* Analiz Sonuçları */}
          {analysisResult && (
            <div className="space-y-4">
              {/* Page Score */}
              {analysisResult.pageScore !== null && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-indigo-900 mb-1">
                        Page SEO Score
                      </h3>
                      <p className="text-xs text-indigo-700">Bu sayfa için hesaplanan SEO skoru</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-black ${
                        analysisResult.pageScore >= 80 ? 'text-green-600' :
                        analysisResult.pageScore >= 60 ? 'text-indigo-600' :
                        analysisResult.pageScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {analysisResult.pageScore}
                      </div>
                      <div className="text-xs text-slate-500">/ 100</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Meta Tags */}
              {analysisResult.localAudit?.meta && (
                <div className="bg-white rounded-lg p-6 border-2 border-slate-200">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Meta Tags
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-600">Title:</span>
                      <p className="text-sm text-slate-900 mt-1">
                        {analysisResult.localAudit.meta.title || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-600">Description:</span>
                      <p className="text-sm text-slate-900 mt-1">
                        {analysisResult.localAudit.meta.description || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-600">H1:</span>
                      <p className="text-sm text-slate-900 mt-1">
                        {analysisResult.localAudit.meta.h1 || 'N/A'}
                      </p>
                    </div>
                    {analysisResult.localAudit.meta.h2 && analysisResult.localAudit.meta.h2.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-slate-600">H2 Tags:</span>
                        <ul className="list-disc list-inside text-sm text-slate-900 mt-1">
                          {analysisResult.localAudit.meta.h2.slice(0, 5).map((h2: string, idx: number) => (
                            <li key={idx}>{h2}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Schema Markup */}
              {analysisResult.localAudit?.schema && (
                <div className="bg-white rounded-lg p-6 border-2 border-slate-200">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Schema Markup
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.localAudit.schema.types?.map((type: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        {type}
                      </Badge>
                    ))}
                    {(!analysisResult.localAudit.schema.types || analysisResult.localAudit.schema.types.length === 0) && (
                      <span className="text-sm text-slate-500">Schema markup bulunamadı</span>
                    )}
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              {analysisResult.localAudit?.performance && (
                <div className="bg-white rounded-lg p-6 border-2 border-slate-200">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analysisResult.localAudit.performance.lcp && (
                      <div>
                        <span className="text-xs font-semibold text-slate-600">LCP:</span>
                        <p className="text-sm text-slate-900 mt-1">
                          {analysisResult.localAudit.performance.lcp}ms
                        </p>
                      </div>
                    )}
                    {analysisResult.localAudit.performance.fid && (
                      <div>
                        <span className="text-xs font-semibold text-slate-600">FID:</span>
                        <p className="text-sm text-slate-900 mt-1">
                          {analysisResult.localAudit.performance.fid}ms
                        </p>
                      </div>
                    )}
                    {analysisResult.localAudit.performance.cls && (
                      <div>
                        <span className="text-xs font-semibold text-slate-600">CLS:</span>
                        <p className="text-sm text-slate-900 mt-1">
                          {analysisResult.localAudit.performance.cls}
                        </p>
                      </div>
                    )}
                    {analysisResult.localAudit.performance.ttfb && (
                      <div>
                        <span className="text-xs font-semibold text-slate-600">TTFB:</span>
                        <p className="text-sm text-slate-900 mt-1">
                          {analysisResult.localAudit.performance.ttfb}ms
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Page-Specific SEO Fixes */}
              {analysisResult.pageFixes && analysisResult.pageFixes.length > 0 && (
                <div className="bg-white rounded-lg p-6 border-2 border-amber-200">
                  <h3 className="text-base font-semibold text-amber-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Page-Specific SEO Fixes
                  </h3>
                  <div className="space-y-2">
                    {analysisResult.pageFixes.map((fix, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          fix.priority === 'HIGH' ? 'bg-red-50 border-red-200' :
                          fix.priority === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {fix.priority === 'HIGH' ? (
                            <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                          ) : fix.priority === 'MEDIUM' ? (
                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-slate-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{fix.message}</p>
                            {fix.code && (
                              <p className="text-xs text-slate-500 mt-1 font-mono">{fix.code}</p>
                            )}
                          </div>
                          <Badge variant="outline" className={
                            fix.priority === 'HIGH' ? 'bg-red-100 text-red-700 border-red-300' :
                            fix.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                            'bg-slate-100 text-slate-700 border-slate-300'
                          }>
                            {fix.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

