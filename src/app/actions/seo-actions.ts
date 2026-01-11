'use server';

import { 
  analyzeSite, 
  reprocessSeoData,
  fetchAndStoreRankedKeywords,
  fetchAndStoreSerpCompetitors,
  fetchAndStoreRelevantPages,
  fetchAndStoreDomainIntersection,
  fetchAndStoreBacklinkSummary,
  fetchAndStoreBacklinkHistory
} from '@/lib/services/seo-manager';
import { revalidatePath } from 'next/cache';

/**
 * Server Actions for SEO Operations
 * 
 * Frontend'den çağrılacak server-side fonksiyonlar
 * - Client-side'a hiçbir API anahtarı sızmaz
 * - Tüm işlemler sunucu tarafından yapılır
 */

interface RefreshSiteMetricsResult {
  success: boolean;
  message: string;
  creditsRemaining?: number;
}

/**
 * Site SEO metriklerini yeniler
 * 
 * @param siteId - Yenilenecek site ID
 * @param agencyId - İşlemi yapan ajans ID (session'dan alınmalı)
 * @param locationCode - ZORUNLU: Ülke lokasyon kodu (örn: 2840=US, 2792=TR)
 * @returns İşlem sonucu
 */
export async function refreshSiteMetricsAction(
  siteId: string,
  agencyId: string,
  locationCode: number
): Promise<RefreshSiteMetricsResult> {
  console.log("🚀 [ACTION] refreshSiteMetricsAction çağrıldı - SiteID:", siteId, "AgencyID:", agencyId);
  
  try {
    if (!siteId || !agencyId || !locationCode) {
      console.error("❌ [ACTION] Eksik parametreler - SiteID:", siteId, "AgencyID:", agencyId, "LocationCode:", locationCode);
      return {
        success: false,
        message: 'Site ID, Ajans ID ve Location Code gerekli',
      };
    }

    console.log("📞 [ACTION] analyzeSite çağrılıyor... (LocationCode:", locationCode, ")");
    const result = await analyzeSite(siteId, agencyId, locationCode);
    console.log("✅ [ACTION] analyzeSite tamamlandı:", {
      creditsRemaining: result.creditsRemaining,
    });

    // Sayfayı revalidate et (cache'i temizle)
    console.log("🔄 [ACTION] Cache temizleniyor...");
    revalidatePath(`/agency/inventory/${siteId}`);
    revalidatePath(`/agency/inventory`); // Liste sayfasını da temizle
    console.log("✅ [ACTION] Cache temizlendi");

    return {
      success: true,
      message: result.message || 'SEO metrikleri başarıyla yenilendi',
      creditsRemaining: result.creditsRemaining,
    };
  } catch (error: any) {
    console.error('❌ [ACTION] Hata:', error);
    return {
      success: false,
      message: error.message || 'SEO metrikleri yenilenirken bir hata oluştu',
    };
  }
}

/**
 * Ham SEO verisini yeniden işle (API'ye gitmez, sadece DB'deki veriyi işler)
 * 
 * @param siteId - Yeniden işlenecek site ID
 * @param locationCode - İşlenecek location code (opsiyonel)
 * @returns İşleme sonucu
 */
export async function reprocessSeoDataAction(
  siteId: string,
  locationCode?: number
): Promise<RefreshSiteMetricsResult> {
  console.log("🔄 [ACTION] reprocessSeoDataAction çağrıldı - SiteID:", siteId, "Location:", locationCode);
  
  try {
    if (!siteId) {
      console.error("❌ [ACTION] Eksik parametreler - SiteID:", siteId);
      return {
        success: false,
        message: 'Site ID gerekli',
      };
    }

    console.log("📞 [ACTION] reprocessSeoData çağrılıyor...");
    const result = await reprocessSeoData(siteId, locationCode);
    console.log("✅ [ACTION] reprocessSeoData tamamlandı:", {
      snappostScore: result.snappostScore,
    });

    // Sayfayı revalidate et (cache'i temizle)
    console.log("🔄 [ACTION] Cache temizleniyor...");
    revalidatePath(`/agency/inventory/${siteId}`);
    revalidatePath(`/agency/inventory`); // Liste sayfasını da temizle
    console.log("✅ [ACTION] Cache temizlendi");

    return {
      success: true,
      message: result.message || 'Veri başarıyla yeniden analiz edildi',
    };
  } catch (error: any) {
    console.error('❌ [ACTION] Hata:', error);
    return {
      success: false,
      message: error.message || 'Veri yeniden analiz edilirken bir hata oluştu',
    };
  }
}

/**
 * Ranked Keywords API'yi çağır
 */
export async function fetchRankedKeywordsAction(
  siteId: string,
  agencyId: string,
  locationCode: number
): Promise<RefreshSiteMetricsResult> {
  try {
    if (!siteId || !agencyId || !locationCode) {
      return { success: false, message: 'Eksik parametreler' };
    }
    const result = await fetchAndStoreRankedKeywords(siteId, agencyId, locationCode);
    revalidatePath(`/agency/inventory/${siteId}`);
    return { success: true, message: result.message, creditsRemaining: result.creditsRemaining };
  } catch (error: any) {
    return { success: false, message: error.message || 'Ranked Keywords çekilemedi' };
  }
}

/**
 * SERP Competitors API'yi çağır
 */
export async function fetchSerpCompetitorsAction(
  siteId: string,
  agencyId: string,
  locationCode: number
): Promise<RefreshSiteMetricsResult> {
  try {
    if (!siteId || !agencyId || !locationCode) {
      return { success: false, message: 'Eksik parametreler' };
    }
    const result = await fetchAndStoreSerpCompetitors(siteId, agencyId, locationCode);
    revalidatePath(`/agency/inventory/${siteId}`);
    return { success: true, message: result.message, creditsRemaining: result.creditsRemaining };
  } catch (error: any) {
    return { success: false, message: error.message || 'SERP Competitors çekilemedi' };
  }
}

/**
 * Relevant Pages API'yi çağır
 */
export async function fetchRelevantPagesAction(
  siteId: string,
  agencyId: string,
  locationCode: number
): Promise<RefreshSiteMetricsResult> {
  try {
    if (!siteId || !agencyId || !locationCode) {
      return { success: false, message: 'Eksik parametreler' };
    }
    const result = await fetchAndStoreRelevantPages(siteId, agencyId, locationCode);
    revalidatePath(`/agency/inventory/${siteId}`);
    return { success: true, message: result.message, creditsRemaining: result.creditsRemaining };
  } catch (error: any) {
    return { success: false, message: error.message || 'Relevant Pages çekilemedi' };
  }
}

/**
 * Domain Intersection API'yi çağır
 */
export async function fetchDomainIntersectionAction(
  siteId: string,
  agencyId: string,
  locationCode: number
): Promise<RefreshSiteMetricsResult> {
  try {
    if (!siteId || !agencyId || !locationCode) {
      return { success: false, message: 'Eksik parametreler' };
    }
    const result = await fetchAndStoreDomainIntersection(siteId, agencyId, locationCode);
    revalidatePath(`/agency/inventory/${siteId}`);
    return { success: true, message: result.message, creditsRemaining: result.creditsRemaining };
  } catch (error: any) {
    return { success: false, message: error.message || 'Domain Intersection çekilemedi' };
  }
}

/**
 * Backlink Summary API'yi çağır
 */
export async function fetchBacklinkSummaryAction(
  siteId: string,
  agencyId: string
): Promise<RefreshSiteMetricsResult> {
  try {
    if (!siteId || !agencyId) {
      return { success: false, message: 'Eksik parametreler' };
    }
    const result = await fetchAndStoreBacklinkSummary(siteId, agencyId);
    revalidatePath(`/agency/inventory/${siteId}`);
    return { success: true, message: result.message, creditsRemaining: result.creditsRemaining };
  } catch (error: any) {
    return { success: false, message: error.message || 'Backlink Summary çekilemedi' };
  }
}

/**
 * Backlink History API'yi çağır
 */
export async function fetchBacklinkHistoryAction(
  siteId: string,
  agencyId: string
): Promise<RefreshSiteMetricsResult> {
  try {
    if (!siteId || !agencyId) {
      return { success: false, message: 'Eksik parametreler' };
    }
    const result = await fetchAndStoreBacklinkHistory(siteId, agencyId);
    revalidatePath(`/agency/inventory/${siteId}`);
    return { success: true, message: result.message, creditsRemaining: result.creditsRemaining };
  } catch (error: any) {
    return { success: false, message: error.message || 'Backlink History çekilemedi' };
  }
}
