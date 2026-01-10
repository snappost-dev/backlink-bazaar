"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, Loader2, RefreshCw, Zap, Globe, Download } from "lucide-react";
import { 
  refreshSiteMetricsAction, 
  reprocessSeoDataAction,
  fetchRankedKeywordsAction,
  fetchSerpCompetitorsAction,
  fetchRelevantPagesAction,
  fetchDomainIntersectionAction,
  fetchBacklinkSummaryAction,
  fetchBacklinkHistoryAction
} from "@/app/actions/seo-actions";
import { HealthCheckPanel } from "@/components/agency/HealthCheckPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Site {
  id: string;
  domain: string;
  basePrice: number;
  finalPrice: number;
  status: string;
}

interface DetailedMetrics {
  pos_1?: number;
  pos_2_3?: number;
  pos_4_10?: number;
  pos_11_100?: number;
  is_new?: number;
  is_lost?: number;
  total_keywords?: number;
}

// Multi-Region rawSeoData Type Definition
interface RawSeoDataMultiRegion {
  [locationCode: string]: {
    [apiName: string]: {
      data: any;
      timestamp?: string;
    };
  };
}

interface InventoryDetailClientProps {
  site: Site;
  agencyId: string; // Ajans ID (session'dan gelecek)
  snappostScore: number | null;
  detailedMetrics: DetailedMetrics | null;
  rawSeoData: RawSeoDataMultiRegion | null; // Ham JSON verisi (Multi-Region yapısı)
  // Hybrid SEO Engine v2.0 - Yeni Props
  scores?: {
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
  seoFixes?: Array<{
    code: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    scoreImpact?: number;
    category: 'TECHNICAL' | 'SEMANTIC' | 'SCHEMA' | 'PERFORMANCE' | 'OTHER';
  }>;
}

export function InventoryDetailClient({ 
  site, 
  agencyId, 
  snappostScore, 
  detailedMetrics,
  rawSeoData,
  scores,
  seoFixes
}: InventoryDetailClientProps) {
  const router = useRouter();
  const [basePrice, setBasePrice] = useState(site.basePrice);
  const [status, setStatus] = useState(site.status);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [selectedLocationCode, setSelectedLocationCode] = useState<number | null>(null);
  
  // Global Pazar Seçimi (Header Dropdown)
  const [globalMarketCode, setGlobalMarketCode] = useState<number>(2840); // Default: ABD
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingApiCall, setPendingApiCall] = useState<{
    apiName: keyof typeof loadingStates;
    action: (siteId: string, agencyId: string, locationCode?: number) => Promise<any>;
    requiresLocation: boolean;
  } | null>(null);
  
  // 7 Kollu Veri Ambarı - Loading States
  const [loadingStates, setLoadingStates] = useState({
    rankedKeywords: false,
    serpCompetitors: false,
    relevantPages: false,
    domainIntersection: false,
    backlinkSummary: false,
    backlinkHistory: false,
  });

  // Ülke lokasyon kodları (DataForSEO)
  const locationOptions = [
    { code: 2840, name: "🇺🇸 Amerika Birleşik Devletleri (US)", flag: "🇺🇸" },
    { code: 2792, name: "🇹🇷 Türkiye (TR)", flag: "🇹🇷" },
    { code: 2826, name: "🇬🇧 Birleşik Krallık (UK)", flag: "🇬🇧" },
    { code: 2276, name: "🇩🇪 Almanya (DE)", flag: "🇩🇪" },
    { code: 2250, name: "🇫🇷 Fransa (FR)", flag: "🇫🇷" },
    { code: 2036, name: "🇦🇺 Avustralya (AU)", flag: "🇦🇺" },
    { code: 2124, name: "🇨🇦 Kanada (CA)", flag: "🇨🇦" },
    { code: 2752, name: "🇳🇱 Hollanda (NL)", flag: "🇳🇱" },
    { code: 2032, name: "🇪🇸 İspanya (ES)", flag: "🇪🇸" },
    { code: 2226, name: "🇮🇹 İtalya (IT)", flag: "🇮🇹" },
  ];

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

  const handleRefreshSeoClick = () => {
    // Önce ülke seçim dialogunu göster
    setShowLocationDialog(true);
  };

  const handleRefreshSeo = async () => {
    if (!selectedLocationCode) {
      setMessage({ type: "error", text: "Lütfen bir ülke seçin" });
      return;
    }

    setShowLocationDialog(false);
    console.log("🖱️ [CLIENT] SEO Yenile butonuna tıklandı - SiteID:", site.id, "AgencyID:", agencyId, "LocationCode:", selectedLocationCode);
    setIsRefreshing(true);
    setMessage(null);

    try {
      console.log("📡 [CLIENT] Server Action çağrılıyor...");
      const result = await refreshSiteMetricsAction(site.id, agencyId, selectedLocationCode);
      console.log("📥 [CLIENT] Server Action yanıtı:", result);

      if (result.success) {
        const successMessage = `${result.message}${result.creditsRemaining !== undefined ? ` (Kalan kredi: ${result.creditsRemaining})` : ""}`;
        console.log("✅ [CLIENT] Başarılı:", successMessage);
        setMessage({
          type: "success",
          text: successMessage,
        });
        
        // Zorla sayfa yenileme - Router.refresh() + window.location.reload() kombinasyonu
        console.log("🔄 [CLIENT] Sayfa yenileniyor...");
        
        // Önce Next.js router'ı refresh et (cache temizle)
        router.refresh();
        
        // Sonra hard reload ile sayfayı tamamen yenile (verilerin güncellenmesi için)
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        console.error("❌ [CLIENT] Hata:", result.message);
        setMessage({ type: "error", text: result.message });
        setIsRefreshing(false);
      }
    } catch (error: any) {
      console.error("❌ [CLIENT] SEO refresh error:", error);
      setMessage({ type: "error", text: error.message || "SEO metrikleri yenilenirken bir hata oluştu" });
      setIsRefreshing(false);
    }
  };

  const handleReprocessData = async () => {
    console.log("🔄 [CLIENT] Veriyi Yeniden Analiz Et butonuna tıklandı - SiteID:", site.id, "Location:", globalMarketCode);
    setIsReprocessing(true);
    setMessage(null);

    try {
      console.log("📡 [CLIENT] reprocessSeoDataAction çağrılıyor...");
      const result = await reprocessSeoDataAction(site.id, globalMarketCode);
      console.log("📥 [CLIENT] reprocessSeoDataAction yanıtı:", result);

      if (result.success) {
        console.log("✅ [CLIENT] Başarılı:", result.message);
        setMessage({
          type: "success",
          text: result.message || 'Veri başarıyla yeniden analiz edildi',
        });
        
        // Sayfayı yenile
        console.log("🔄 [CLIENT] Sayfa yenileniyor...");
        router.refresh();
        
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        console.error("❌ [CLIENT] Hata:", result.message);
        setMessage({ type: "error", text: result.message });
        setIsReprocessing(false);
      }
    } catch (error: any) {
      console.error("❌ [CLIENT] Reprocess error:", error);
      setMessage({ type: "error", text: error.message || "Veri yeniden analiz edilirken bir hata oluştu" });
      setIsReprocessing(false);
    }
  };

  const handleDownloadJson = () => {
    if (!rawSeoData) {
      setMessage({ type: "error", text: "İndirilecek JSON verisi bulunamadı" });
      return;
    }

    try {
      // Seçili location code'un verilerini filtrele
      const locationKey = String(globalMarketCode);
      
      // Multi-Region Storage'dan seçili location'ın verilerini al
      let dataToDownload: any;
      if (rawSeoData[locationKey]) {
        // Seçili location'ın verilerini al
        dataToDownload = {
          location: locationKey,
          locationName: locationOptions.find(loc => loc.code === globalMarketCode)?.name || locationKey,
          data: rawSeoData[locationKey]
        };
      } else {
        // Location verisi yoksa tüm veriyi indir
        dataToDownload = rawSeoData;
      }
      
      // Domain'den dosya adı oluştur
      const domain = site.domain.replace(/[^a-z0-9]/gi, '-');
      const locationName = locationOptions.find(loc => loc.code === globalMarketCode)?.name.split('(')[0].trim().replace(/\s+/g, '-') || locationKey;
      const filename = `${domain}-${locationName}-analiz-${new Date().toISOString().split('T')[0]}.json`;
      
      // JSON'u formatla
      const jsonString = JSON.stringify(dataToDownload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // İndirme linki oluştur
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMessage({ type: "success", text: `JSON dosyası indirildi: ${filename}` });
    } catch (error: any) {
      console.error("JSON indirme hatası:", error);
      setMessage({ type: "error", text: "JSON dosyası indirilemedi" });
    }
  };

  // 7 Kollu Veri Ambarı - Generic API Call Handler (Location Gerektiren)
  const handleApiCallWithLocation = async (
    apiName: keyof typeof loadingStates,
    action: (siteId: string, agencyId: string, locationCode: number) => Promise<any>,
    locationCode: number
  ) => {
    // Onay modalını göster
    setPendingApiCall({
      apiName,
      action: action as any,
      requiresLocation: true
    });
    setShowConfirmModal(true);
  };

  // Onay modalından onaylandığında API çağrısını yap
  const executePendingApiCall = async () => {
    if (!pendingApiCall) return;

    setShowConfirmModal(false);
    const { apiName, action, requiresLocation } = pendingApiCall;
    const locationCode = requiresLocation ? globalMarketCode : undefined;

    setLoadingStates(prev => ({ ...prev, [apiName]: true }));
    setMessage(null);

    try {
      const result = requiresLocation
        ? await action(site.id, agencyId, locationCode!)
        : await action(site.id, agencyId);

      if (result.success) {
        setMessage({
          type: "success",
          text: `✅ Veri Kasaya Eklendi! ${result.message}${result.creditsRemaining !== undefined ? ` (Kalan: ${result.creditsRemaining})` : ''}`
        });
        
        // Sayfayı yenile - router.refresh() + window.location.reload() kombinasyonu
        router.refresh();
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        setMessage({ type: "error", text: result.message || 'API çağrısı başarısız' });
      }
    } catch (error: any) {
      console.error(`[${apiName}] API hatası:`, error);
      setMessage({ type: "error", text: error.message || 'API çağrısı sırasında bir hata oluştu' });
    } finally {
      setLoadingStates(prev => ({ ...prev, [apiName]: false }));
      setPendingApiCall(null);
    }
  };

  // 7 Kollu Veri Ambarı - Generic API Call Handler (Location Gerektirmeyen)
  const handleApiCallWithoutLocation = async (
    apiName: keyof typeof loadingStates,
    action: (siteId: string, agencyId: string) => Promise<any>
  ) => {
    // Onay modalını göster
    setPendingApiCall({
      apiName,
      action: action as any,
      requiresLocation: false
    });
    setShowConfirmModal(true);
  };

  // Trend analizi
  const isGrowing = detailedMetrics && 
    (detailedMetrics.is_new || 0) > (detailedMetrics.is_lost || 0);

  // Veri Parse Helper Fonksiyonları
  const getLocationData = (locationCode: number | null) => {
    if (!rawSeoData || !locationCode) return null;
    const locationKey = String(locationCode);
    return rawSeoData[locationKey] || null;
  };

  const getApiData = (locationCode: number | null, apiName: string) => {
    const locationData = getLocationData(locationCode);
    if (!locationData || !locationData[apiName]) return null;
    return locationData[apiName].data;
  };

  const getGlobalData = (apiName: string) => {
    if (!rawSeoData) return null;
    const globalData = rawSeoData['global'] || rawSeoData['0'];
    if (!globalData || !globalData[apiName]) return null;
    return globalData[apiName].data;
  };

  // Ranked Keywords Parser
  const parseRankedKeywords = (locationCode: number | null) => {
    const apiData = getApiData(locationCode, 'ranked_keywords');
    if (!apiData?.tasks?.[0]?.result?.[0]?.items) return null;
    return apiData.tasks[0].result[0].items.slice(0, 10); // İlk 10
  };

  // SERP Competitors Parser
  const parseSerpCompetitors = (locationCode: number | null) => {
    const apiData = getApiData(locationCode, 'serp_competitors');
    if (!apiData?.tasks?.[0]?.result?.[0]?.items) return null;
    return apiData.tasks[0].result[0].items;
  };

  // Relevant Pages Parser
  const parseRelevantPages = (locationCode: number | null) => {
    const apiData = getApiData(locationCode, 'relevant_pages');
    if (!apiData?.tasks?.[0]?.result?.[0]?.items) return null;
    return apiData.tasks[0].result[0].items;
  };

  // Backlink Summary Parser (Global)
  const parseBacklinkSummary = () => {
    const apiData = getGlobalData('backlink_summary');
    if (!apiData?.tasks?.[0]?.result?.[0]) return null;
    return apiData.tasks[0].result[0];
  };

  // Seçili location için veriler
  const selectedLocation = globalMarketCode || selectedLocationCode;
  const rankedKeywords = parseRankedKeywords(selectedLocation);
  const serpCompetitors = parseSerpCompetitors(selectedLocation);
  const relevantPages = parseRelevantPages(selectedLocation);
  const backlinkSummary = parseBacklinkSummary();

  return (
    <div className="space-y-6">
      {/* Veri Yok Uyarısı */}
      {snappostScore === null && !detailedMetrics && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-[2.5rem] p-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-800">SEO Verisi Henüz Çekilmedi</p>
              <p className="text-sm text-yellow-700 mt-1">
                "SEO Metriklerini Yenile" butonuna tıklayarak analiz başlatın.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Snappost Score Kartı - Speedometer */}
      {snappostScore !== null && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2.5rem] p-8 border-2 border-indigo-200">
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">
              Snappost Authority Score
            </h3>
            {/* Circular Progress Ring */}
            <div className="relative w-48 h-48 mb-4">
              <svg className="transform -rotate-90 w-48 h-48">
                {/* Background Circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  className="text-slate-200"
                />
                {/* Progress Circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - snappostScore / 100)}`}
                  className={`transition-all duration-500 ${
                    snappostScore >= 80 ? 'text-green-500' :
                    snappostScore >= 60 ? 'text-indigo-500' :
                    snappostScore >= 40 ? 'text-yellow-500' : 'text-red-500'
                  }`}
                />
              </svg>
              {/* Score Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-5xl font-black ${
                    snappostScore >= 80 ? 'text-green-600' :
                    snappostScore >= 60 ? 'text-indigo-600' :
                    snappostScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {snappostScore}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">/ 100</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 font-medium">
              Hesaplanan Otorite Puanı
            </p>
          </div>
        </div>
      )}

      {/* Trend Yorumu */}
      {detailedMetrics && (
        <div className={`p-4 rounded-[2.5rem] border-2 ${
          isGrowing 
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{isGrowing ? '🚀' : '🔻'}</span>
            <div>
              <p className="font-semibold">
                {isGrowing ? 'Site Büyüyor' : 'Site Kan Kaybediyor'}
              </p>
              <p className="text-xs opacity-80">
                Yeni Kelimeler: {detailedMetrics.is_new || 0} | 
                Kayıp Kelimeler: {detailedMetrics.is_lost || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detay Tablosu - SEO Analiz Tablosu */}
      {detailedMetrics ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
          <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-900">Detaylı SEO Analiz Tablosu</h3>
            <p className="text-xs text-indigo-600 mt-1">Anahtar kelime pozisyon dağılımı ve trend analizi</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Kelime Sayısı
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Oran
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-yellow-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-600">🥇</span>
                      <span className="text-sm font-medium text-slate-900">Pozisyon 1 (Gold)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                    {detailedMetrics.pos_1 || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                    {detailedMetrics.total_keywords 
                      ? `${((detailedMetrics.pos_1 || 0) / detailedMetrics.total_keywords * 100).toFixed(1)}%`
                      : '0%'}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">🥈</span>
                      <span className="text-sm font-medium text-slate-900">Pozisyon 2-3 (Silver)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                    {detailedMetrics.pos_2_3 || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                    {detailedMetrics.total_keywords 
                      ? `${((detailedMetrics.pos_2_3 || 0) / detailedMetrics.total_keywords * 100).toFixed(1)}%`
                      : '0%'}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">🥉</span>
                      <span className="text-sm font-medium text-slate-900">Pozisyon 4-10 (Bronze)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                    {detailedMetrics.pos_4_10 || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                    {detailedMetrics.total_keywords 
                      ? `${((detailedMetrics.pos_4_10 || 0) / detailedMetrics.total_keywords * 100).toFixed(1)}%`
                      : '0%'}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">📊</span>
                      <span className="text-sm font-medium text-slate-900">Pozisyon 11-100</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                    {detailedMetrics.pos_11_100 || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                    {detailedMetrics.total_keywords 
                      ? `${((detailedMetrics.pos_11_100 || 0) / detailedMetrics.total_keywords * 100).toFixed(1)}%`
                      : '0%'}
                  </td>
                </tr>
                <tr className="bg-green-50 border-t-2 border-green-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✨</span>
                      <span className="text-sm font-medium text-green-900">Yeni Kelimeler</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-900">
                    {detailedMetrics.is_new || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-700">
                    -
                  </td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600">📉</span>
                      <span className="text-sm font-medium text-red-900">Kayıp Kelimeler</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-900">
                    {detailedMetrics.is_lost || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-700">
                    -
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200">
          <div className="text-center text-slate-500">
            <p className="text-sm font-medium">Detaylı SEO Analiz Tablosu</p>
            <p className="text-xs mt-2">Detaylı SEO analiz verisi henüz mevcut değil.</p>
            <p className="text-xs mt-1">"SEO Metriklerini Yenile" butonuna tıklayın.</p>
          </div>
        </div>
      )}

      {/* 🛠️ Gelişmiş Veri Madenciliği - Analysis Control Panel */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-[2.5rem] p-6 border-2 border-indigo-200">
        {/* Header: Hedef Pazar Seçimi */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-indigo-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛠️</span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Gelişmiş Veri Madenciliği</h3>
              <p className="text-xs text-slate-600">7 kollu veri ambarı - Her API çağrısı 1 kredi harcar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Hedef Pazar:</label>
            <select
              value={globalMarketCode}
              onChange={(e) => {
                setGlobalMarketCode(Number(e.target.value));
                setSelectedLocationCode(Number(e.target.value)); // Sync with selectedLocationCode
              }}
              className="px-3 py-2 rounded-[2.5rem] border border-indigo-300 bg-white text-sm font-medium text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {locationOptions.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.flag} {loc.name.split('(')[0].trim()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* A. Pazar İstihbaratı (Labs API - Location Zorunlu) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <h4 className="text-sm font-semibold text-slate-700">A. Pazar İstihbaratı (Labs API - Location Zorunlu)</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => handleApiCallWithLocation('rankedKeywords', fetchRankedKeywordsAction, globalMarketCode)}
              disabled={loadingStates.rankedKeywords || isSaving}
              variant="outline"
              size="sm"
              className="rounded-[2.5rem] border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            >
              {loadingStates.rankedKeywords ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="text-xs">Ranked Keywords</span>
                  <span className="text-[10px] text-blue-500 ml-1">(1)</span>
                </>
              )}
            </Button>
            <Button
              onClick={() => handleApiCallWithLocation('serpCompetitors', fetchSerpCompetitorsAction, globalMarketCode)}
              disabled={loadingStates.serpCompetitors || isSaving}
              variant="outline"
              size="sm"
              className="rounded-[2.5rem] border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            >
              {loadingStates.serpCompetitors ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="text-xs">SERP Competitors</span>
                  <span className="text-[10px] text-blue-500 ml-1">(1)</span>
                </>
              )}
            </Button>
            <Button
              onClick={() => handleApiCallWithLocation('relevantPages', fetchRelevantPagesAction, globalMarketCode)}
              disabled={loadingStates.relevantPages || isSaving}
              variant="outline"
              size="sm"
              className="rounded-[2.5rem] border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            >
              {loadingStates.relevantPages ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="text-xs">Relevant Pages</span>
                  <span className="text-[10px] text-blue-500 ml-1">(1)</span>
                </>
              )}
            </Button>
            <Button
              onClick={() => handleApiCallWithLocation('domainIntersection', fetchDomainIntersectionAction, globalMarketCode)}
              disabled={loadingStates.domainIntersection || isSaving}
              variant="outline"
              size="sm"
              className="rounded-[2.5rem] border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            >
              {loadingStates.domainIntersection ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="text-xs">Domain Intersection</span>
                  <span className="text-[10px] text-blue-500 ml-1">(1)</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* B. Otorite ve Güven (Backlink API - Global) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <h4 className="text-sm font-semibold text-slate-700">B. Otorite ve Güven (Backlink API - Global)</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleApiCallWithoutLocation('backlinkSummary', fetchBacklinkSummaryAction)}
              disabled={loadingStates.backlinkSummary || isSaving}
              variant="outline"
              size="sm"
              className="rounded-[2.5rem] border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
            >
              {loadingStates.backlinkSummary ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="text-xs">Backlink Summary</span>
                  <span className="text-[10px] text-purple-500 ml-1">(1)</span>
                </>
              )}
            </Button>
            <Button
              onClick={() => handleApiCallWithoutLocation('backlinkHistory', fetchBacklinkHistoryAction)}
              disabled={loadingStates.backlinkHistory || isSaving}
              variant="outline"
              size="sm"
              className="rounded-[2.5rem] border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
            >
              {loadingStates.backlinkHistory ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="text-xs">Backlink History</span>
                  <span className="text-[10px] text-purple-500 ml-1">(1)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 🏥 Health Check Panel (Hybrid SEO Engine v2.0) */}
      {scores && (scores.s_tech !== null || scores.s_global !== null) && (
        <HealthCheckPanel 
          scores={scores} 
          seoFixes={seoFixes || []} 
        />
      )}

      {/* 📊 Analiz Sonuçları - Dinamik Veri Görselleştirme */}
      {(rankedKeywords || serpCompetitors || relevantPages || backlinkSummary) && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-200">
              <span className="text-3xl">📊</span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Analiz Sonuçları</h3>
                <p className="text-xs text-slate-600">
                  {selectedLocation 
                    ? locationOptions.find(loc => loc.code === selectedLocation)?.name || `Location: ${selectedLocation}`
                    : 'Global Veriler'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* En Değerli Kelimeler Tablosu */}
              {rankedKeywords && rankedKeywords.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
                  <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
                    <h4 className="text-base font-semibold text-indigo-900">En Değerli Kelimeler</h4>
                    <p className="text-xs text-indigo-600 mt-1">İlk 10 kelime - En yüksek hacimli</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Kelime</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Hacim</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">CPC ($)</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Niyet</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Zorluk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {rankedKeywords.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">
                              {item.keyword || item.key || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-slate-600">
                              {item.search_volume?.toLocaleString('tr-TR') || item.volume?.toLocaleString('tr-TR') || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-slate-600">
                              ${item.cpc?.toFixed(2) || item.cpc_top?.toFixed(2) || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.intent === 'informational' || item.intent === '0' 
                                  ? 'bg-blue-100 text-blue-700'
                                  : item.intent === 'commercial' || item.intent === '1'
                                  ? 'bg-green-100 text-green-700'
                                  : item.intent === 'transactional' || item.intent === '2'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {item.intent === '0' ? 'Bilgi' : item.intent === '1' ? 'Ticari' : item.intent === '2' ? 'Satın Alma' : item.intent || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-slate-600">
                              {item.keyword_difficulty?.toFixed(0) || item.difficulty?.toFixed(0) || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pazar Rakipleri Listesi */}
              {serpCompetitors && serpCompetitors.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
                  <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
                    <h4 className="text-base font-semibold text-purple-900">Pazar Rakipleri</h4>
                    <p className="text-xs text-purple-600 mt-1">SERP'te en çok görünen rakipler</p>
                  </div>
                  <div className="overflow-y-auto max-h-[500px]">
                    <div className="divide-y divide-slate-200">
                      {serpCompetitors.slice(0, 20).map((item: any, index: number) => (
                        <div key={index} className="px-6 py-4 hover:bg-slate-50">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {item.domain || item.target || '-'}
                              </p>
                              {item.common_keywords && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Ortak Kelimeler: <span className="font-semibold">{item.common_keywords}</span>
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {item.rank_group && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                  Skor: {item.rank_group}
                                </span>
                              )}
                              {item.relevance_score && (
                                <p className="text-xs text-slate-600 mt-1">
                                  Alaka: {item.relevance_score.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Trafik Canavarı Sayfalar */}
              {relevantPages && relevantPages.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
                  <div className="bg-green-50 px-6 py-4 border-b border-green-200">
                    <h4 className="text-base font-semibold text-green-900">Trafik Canavarı Sayfalar</h4>
                    <p className="text-xs text-green-600 mt-1">En çok trafik alan sayfalar</p>
                  </div>
                  <div className="overflow-y-auto max-h-[500px]">
                    <div className="divide-y divide-slate-200">
                      {relevantPages.slice(0, 20).map((item: any, index: number) => (
                        <div key={index} className="px-6 py-4 hover:bg-slate-50">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 break-words">
                                {item.page || item.url || item.target || '-'}
                              </p>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              {item.rank_group && (
                                <p className="text-sm font-semibold text-green-700">
                                  Trafik: {item.rank_group.toLocaleString('tr-TR')}
                                </p>
                              )}
                              {item.estimated_paid_traffic_cost && (
                                <p className="text-xs text-slate-600 mt-1">
                                  ${item.estimated_paid_traffic_cost.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Otorite Kartı (Backlink Summary - Global) */}
              {backlinkSummary && (
                <div className="bg-white rounded-[2.5rem] border-2 border-indigo-200 overflow-hidden">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 px-6 py-4 border-b border-indigo-200">
                    <h4 className="text-base font-semibold text-indigo-900">Otorite Kartı</h4>
                    <p className="text-xs text-indigo-600 mt-1">Global backlink özeti</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {backlinkSummary.backlinks && (
                      <div className="flex items-center justify-between py-3 border-b border-slate-200">
                        <span className="text-sm font-medium text-slate-700">Toplam Backlink</span>
                        <span className="text-lg font-bold text-indigo-700">
                          {backlinkSummary.backlinks.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    )}
                    {backlinkSummary.domains && (
                      <div className="flex items-center justify-between py-3 border-b border-slate-200">
                        <span className="text-sm font-medium text-slate-700">Domain Sayısı</span>
                        <span className="text-lg font-bold text-indigo-700">
                          {backlinkSummary.domains.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    )}
                    {(backlinkSummary.backlinks && backlinkSummary.domains) && (
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm font-medium text-slate-700">Ortalama Backlink/Domain</span>
                        <span className="text-lg font-bold text-purple-700">
                          {(backlinkSummary.backlinks / backlinkSummary.domains).toFixed(1)}
                        </span>
                      </div>
                    )}
                    {backlinkSummary.rank && (
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">Trust Score</span>
                          <span className="text-2xl font-black text-indigo-600">
                            {backlinkSummary.rank}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Action Buttons - Üçlü Set */}
      <div className="space-y-3 pt-4 border-t border-indigo-200">
        {/* Buton Açıklamaları */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span>API - Ücretli (1 Kredi)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span>DB - Ücretsiz</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Export</span>
          </div>
        </div>
        
        {/* Butonlar */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleRefreshSeoClick}
            disabled={isRefreshing || isSaving || isReprocessing}
            variant="outline"
            className="rounded-[2.5rem] border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
            title="API'den yeni veri çeker (1 kredi harcar)"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Yenileniyor...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                SEO Metriklerini Yenile
              </>
            )}
          </Button>
          <Button
            onClick={handleReprocessData}
            disabled={isReprocessing || isSaving || isRefreshing}
            variant="outline"
            className="rounded-[2.5rem] border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
            title="Mevcut ham veriyi yeniden analiz eder (kredi harcamaz)"
          >
            {isReprocessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analiz Ediliyor...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Veriyi Yeniden Analiz Et
              </>
            )}
          </Button>
          <Button
            onClick={handleDownloadJson}
            disabled={!rawSeoData || isSaving || isRefreshing || isReprocessing}
            variant="outline"
            className="rounded-[2.5rem] border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50"
            title={!rawSeoData ? "Ham JSON verisi bulunamadı" : "Ham JSON verisini bilgisayarınıza indirir"}
          >
            <Download className="w-4 h-4 mr-2" />
            JSON İndir
          </Button>
        </div>
        
        {/* Kaydet Butonu */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || isRefreshing || isReprocessing}
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

      {/* Ülke Seçim Dialogu */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              Analiz Ülkesi Seçin
            </DialogTitle>
            <DialogDescription>
              SEO analizi için hangi ülkenin Google sonuçlarını kullanmak istiyorsunuz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {locationOptions.map((location) => (
              <button
                key={location.code}
                onClick={() => setSelectedLocationCode(location.code)}
                className={`w-full text-left p-4 rounded-[2.5rem] border-2 transition-all ${
                  selectedLocationCode === location.code
                    ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{location.flag}</span>
                  <span className="font-medium">{location.name}</span>
                  {selectedLocationCode === location.code && (
                    <span className="ml-auto text-indigo-600">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLocationDialog(false);
                // selectedLocationCode'u koru, sadece dialog'u kapat
              }}
              className="rounded-[2.5rem]"
            >
              İptal
            </Button>
            <Button
              onClick={handleRefreshSeo}
              disabled={!selectedLocationCode || isRefreshing}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-[2.5rem]"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analiz Başlatılıyor...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Analizi Başlat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onay Modalı - Güvenlik */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Analiz Başlatılıyor
            </DialogTitle>
            <DialogDescription>
              {pendingApiCall && (
                <div className="space-y-3 mt-4">
                  <div className="bg-indigo-50 p-4 rounded-[2.5rem] border border-indigo-200">
                    <p className="text-sm font-medium text-indigo-900">
                      Şu an <span className="font-bold">
                      {pendingApiCall.requiresLocation 
                        ? (locationOptions.find(loc => loc.code === globalMarketCode)?.flag || '🌍')
                        : '🌍'} {
                        pendingApiCall.requiresLocation
                          ? (locationOptions.find(loc => loc.code === globalMarketCode)?.name.split('(')[0].trim() || 'Global')
                          : 'Global'
                      } ({pendingApiCall.requiresLocation ? globalMarketCode : 'Global'})
                      </span> pazarı için tarama yapıyorsunuz.
                    </p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-[2.5rem] border border-amber-200">
                    <p className="text-sm font-medium text-amber-900">
                      ⚠️ Bu işlem <span className="font-bold text-red-600">1 Kredi</span> harcayacaktır.
                    </p>
                  </div>
                  <div className="text-xs text-slate-600">
                    API: <span className="font-mono font-semibold">{pendingApiCall.apiName}</span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmModal(false);
                setPendingApiCall(null);
              }}
              className="rounded-[2.5rem]"
            >
              İptal
            </Button>
            <Button
              onClick={executePendingApiCall}
              disabled={!pendingApiCall}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-[2.5rem]"
            >
              Onayla ve Tara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

