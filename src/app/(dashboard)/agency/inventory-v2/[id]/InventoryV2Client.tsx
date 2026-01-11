"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, AlertCircle, CheckCircle2, Clock, TrendingUp, Shield, Download, Globe, Code } from "lucide-react";
import type { LocalAuditResponse, SiteInsights, SeoFix, RawSeoDataMultiRegion } from "@/lib/types/seo";
import { refreshSiteMetricsAction } from "@/app/actions/seo-actions";
import { Phase1DetailedAnalysis } from "@/components/agency/inventory-v2/Phase1DetailedAnalysis";

interface Site {
  id: string;
  domain: string;
  basePrice: number;
  finalPrice: number;
  status: string;
  category: string;
  verificationStatus: string;
  createdAt: Date;
  rawSeoData: any;
  snappostScore: number | null;
  trafficData: any;
  lastSeoCheck: Date | null;
  s_tech: number | null;
  s_sem: number | null;
  s_link: number | null;
  s_schema: number | null;
  s_mon: number | null;
  s_eeat: number | null;
  s_fresh: number | null;
  s_viral: number | null;
  s_ux: number | null;
  s_global: number | null;
}

interface InventoryV2ClientProps {
  site: Site;
  agencyId: string;
  agencyCredits: number;
  phase0Data: {
    localAudit: LocalAuditResponse | null;
    s_tech: number | null;
    s_schema: number | null;
    s_ux: number | null;
    quickFixes: SeoFix[];
  };
  phase1Data: {
    isAvailable: boolean;
    rankedKeywords: any[] | null;
    serpCompetitors: any[] | null;
    relevantPages: any[] | null;
    backlinkSummary: any | null;
    domainIntersection: any | null;
    backlinkHistory: any | null;
    historicalRank: any | null;
  };
  scores: {
    s_tech: number | null;
    s_sem: number | null;
    s_link: number | null;
    s_schema: number | null;
    s_mon: number | null;
    s_eeat: number | null;
    s_fresh: number | null;
    s_viral: number | null;
    s_ux: number | null;
    s_global: number | null;
  };
  aiInsights: SiteInsights | null;
  siteDNA: {
    topKeywords: string[];
    aiInsights: SiteInsights | null;
    hasEmbedding: boolean;
  };
  seoFixes: SeoFix[];
  similarSites: Array<{
    site: any;
    similarity: number;
    dna: any;
  }> | null;
  rawSeoData: RawSeoDataMultiRegion | null;
}

export function InventoryV2Client({
  site,
  agencyId,
  agencyCredits,
  phase0Data,
  phase1Data,
  scores,
  aiInsights,
  siteDNA,
  seoFixes,
  similarSites,
  rawSeoData,
}: InventoryV2ClientProps) {
  const [isActivatingPhase1, setIsActivatingPhase1] = useState(false);
  const [showPhase1Activation, setShowPhase1Activation] = useState(false);

  // Phase 1 Activation Handler
  const handlePhase1Activation = async () => {
    if (agencyCredits < 1) {
      alert('Yeterli krediniz yok. Lütfen kredi ekleyin.');
      return;
    }

    setIsActivatingPhase1(true);
    try {
      const result = await refreshSiteMetricsAction(site.id, agencyId, 2840); // Default location: US
      if (result.success) {
        // Reload page to show Phase 1 data
        window.location.reload();
      } else {
        alert(`Hata: ${result.message || 'Phase 1 aktivasyonu başarısız'}`);
      }
    } catch (error: any) {
      console.error('Phase 1 activation error:', error);
      alert(`Hata: ${error.message || 'Bilinmeyen bir hata oluştu'}`);
    } finally {
      setIsActivatingPhase1(false);
      setShowPhase1Activation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Phase 0: Quick Preview (Üst Kısım) */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">Phase 0: Hızlı Önizleme</CardTitle>
                <CardDescription className="text-blue-700">
                  CF Worker - Ücretsiz Adil Kullanım Kotası
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              Ücretsiz
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {phase0Data.localAudit ? (
            <div className="space-y-4">
              {/* Phase 0 Health Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={getScoreBgColor(phase0Data.s_tech)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Technical Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(phase0Data.s_tech)}`}>
                          {phase0Data.s_tech ?? '-'}
                        </p>
                      </div>
                      <Shield className={`w-8 h-8 ${getScoreColor(phase0Data.s_tech)}`} />
                    </div>
                  </CardContent>
                </Card>
                <Card className={getScoreBgColor(phase0Data.s_schema)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Schema Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(phase0Data.s_schema)}`}>
                          {phase0Data.s_schema ?? '-'}
                        </p>
                      </div>
                      <Code className={`w-8 h-8 ${getScoreColor(phase0Data.s_schema)}`} />
                    </div>
                  </CardContent>
                </Card>
                <Card className={getScoreBgColor(phase0Data.s_ux)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">UX Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(phase0Data.s_ux)}`}>
                          {phase0Data.s_ux ?? '-'}
                        </p>
                      </div>
                      <TrendingUp className={`w-8 h-8 ${getScoreColor(phase0Data.s_ux)}`} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Fixes */}
              {phase0Data.quickFixes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Kritik Sorunlar</h4>
                  <div className="space-y-2">
                    {phase0Data.quickFixes.slice(0, 5).map((fix, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-200"
                      >
                        {getPriorityIcon(fix.priority)}
                        <span className="text-sm text-slate-700">{fix.message}</span>
                        <Badge
                          variant="outline"
                          className={`ml-auto ${
                            fix.priority === 'HIGH'
                              ? 'bg-red-50 text-red-700 border-red-300'
                              : fix.priority === 'MEDIUM'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                              : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          {fix.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase 1 Activation Button */}
              {!phase1Data.isAvailable && (
                <div className="pt-4 border-t border-blue-200">
                  <Button
                    onClick={() => setShowPhase1Activation(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isActivatingPhase1 || agencyCredits < 1}
                  >
                    {isActivatingPhase1 ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Aktifleştiriliyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Phase 1 Detaylı Analiz Başlat (1 Kredi)
                      </>
                    )}
                  </Button>
                  {agencyCredits < 1 && (
                    <p className="text-xs text-red-600 mt-2 text-center">
                      Yeterli krediniz yok. Lütfen kredi ekleyin.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <p className="text-sm text-blue-700">
                Phase 0 verisi henüz çekilmedi. Site ekleme işlemi sırasında otomatik olarak çekilecek.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase 1: Detailed Analysis (Alt Kısım) */}
      {phase1Data.isAvailable ? (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-purple-900">Phase 1: Detaylı Analiz</CardTitle>
                  <CardDescription className="text-purple-700">
                    DataForSEO - 7 API'den Gelen Kapsamlı Veriler
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                Premium
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Phase1DetailedAnalysis
              rankedKeywords={phase1Data.rankedKeywords}
              serpCompetitors={phase1Data.serpCompetitors}
              relevantPages={phase1Data.relevantPages}
              backlinkSummary={phase1Data.backlinkSummary}
              aiInsights={aiInsights}
              scores={scores}
              seoFixes={seoFixes}
              similarSites={similarSites}
              agencyId={agencyId}
              agencyCredits={agencyCredits}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-purple-300 bg-purple-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="w-12 h-12 text-purple-400 mb-3" />
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Phase 1 Henüz Aktif Değil</h3>
            <p className="text-sm text-purple-700 text-center max-w-md mb-4">
              Detaylı analiz için Phase 1'i aktifleştirin. Bu işlem 1 kredi kullanır ve 7 farklı
              DataForSEO API'sinden veri çeker.
            </p>
            <Button
              onClick={() => setShowPhase1Activation(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isActivatingPhase1 || agencyCredits < 1}
            >
              {isActivatingPhase1 ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Aktifleştiriliyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Phase 1'i Aktifleştir (1 Kredi)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Phase 1 Activation Dialog */}
      {showPhase1Activation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Phase 1 Aktivasyonu</CardTitle>
              <CardDescription>
                Detaylı analiz için 1 kredi kullanılacak. Devam etmek istiyor musunuz?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-900 mb-2">Mevcut Krediniz:</p>
                <p className="text-2xl font-bold text-purple-700">{agencyCredits}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-900 mb-2">Kullanılacak Kredi:</p>
                <p className="text-2xl font-bold text-slate-700">1</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPhase1Activation(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  onClick={handlePhase1Activation}
                  disabled={isActivatingPhase1 || agencyCredits < 1}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isActivatingPhase1 ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Aktifleştiriliyor...
                    </>
                  ) : (
                    'Onayla ve Başlat'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getScoreColor(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-indigo-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBgColor(score: number | null): string {
  if (score === null) return 'bg-slate-50 border-slate-200';
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-indigo-50 border-indigo-200';
  if (score >= 40) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

function getPriorityIcon(priority: string) {
  if (priority === 'HIGH') return <AlertCircle className="w-4 h-4 text-red-600" />;
  if (priority === 'MEDIUM') return <AlertCircle className="w-4 h-4 text-yellow-600" />;
  return <AlertCircle className="w-4 h-4 text-slate-600" />;
}


