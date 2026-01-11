import prisma from '@/lib/prisma';
import { 
  fetchSeoData, 
  validateDomain,
  fetchRankedKeywords,
  fetchSerpCompetitors,
  fetchRelevantPages,
  fetchDomainIntersection,
  fetchBacklinkSummary,
  fetchBacklinkHistory
} from '@/lib/api/dataforseo';
import { fetchLocalAudit } from '@/lib/api/cloudflare-worker';
import type { LocalAuditResponse, SeoFix } from '@/lib/types/seo';

/**
 * SEO Manager Service
 * 
 * Kredi sistemi ile SEO analizi yönetimi
 * - Kredi kontrolü
 * - DataForSEO API entegrasyonu
 * - Transaction yönetimi (Prisma transaction)
 * - Log kaydı
 */

/**
 * Technical Score (S_tech) - CF Worker
 * 
 * Mantık: H1 eksikse -10, SSL yoksa -20 puan
 * 
 * @param localAudit - Local Audit verisi (CF Worker yanıtı)
 * @returns 0-100 arası Technical Score
 */
function calculateTechnicalScore(localAudit: LocalAuditResponse): number {
  let score = 100; // Başlangıç puanı
  
  // H1 eksikse -10
  if (!localAudit.meta?.h1 || localAudit.meta.h1.trim() === '') {
    score -= 10;
  }
  
  // SSL yoksa -20
  if (localAudit.technical?.ssl === false) {
    score -= 20;
  }
  
  // Title eksikse -5
  if (!localAudit.meta?.title || localAudit.meta.title.trim() === '') {
    score -= 5;
  }
  
  // Description eksikse -5
  if (!localAudit.meta?.description || localAudit.meta.description.trim() === '') {
    score -= 5;
  }
  
  // Canonical eksikse -10
  if (!localAudit.meta?.canonical) {
    score -= 10;
  }
  
  // Robots.txt yoksa -5
  if (localAudit.technical?.robots === false || !localAudit.technical?.robots) {
    score -= 5;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Semantic Score (S_sem) - Local Audit + DFS ranked_keywords
 * 
 * Mantık: Anahtar kelime yoğunluğu (Local) + Sıralama başarısı (DFS)
 * 
 * @param localAudit - Local Audit verisi
 * @param rankedKeywords - DFS ranked_keywords verisi
 * @returns 0-100 arası Semantic Score
 */
function calculateSemanticScore(
  localAudit: LocalAuditResponse,
  rankedKeywords: any
): number {
  let localScore = 50; // Local Audit: Anahtar kelime yoğunluğu (basit hesaplama)
  
  // H1, H2, Title, Description varlığı kontrolü
  if (localAudit.meta?.h1 && localAudit.meta.h1.trim() !== '') localScore += 10;
  if (localAudit.meta?.h2 && localAudit.meta.h2.length > 0) localScore += 10;
  if (localAudit.meta?.title && localAudit.meta.title.trim() !== '') localScore += 15;
  if (localAudit.meta?.description && localAudit.meta.description.trim() !== '') localScore += 15;
  
  // DFS: Sıralama başarısı (ranked_keywords)
  let dfsScore = 0;
  
  if (rankedKeywords?.tasks?.[0]?.result?.[0]?.items) {
    const items = rankedKeywords.tasks[0].result[0].items;
    // İlk 10'da kaç kelime var?
    const top10Count = items.filter((item: any) => (item.rank_group || 0) <= 10).length;
    const totalCount = items.length;
    
    if (totalCount > 0) {
      dfsScore = (top10Count / totalCount) * 100;
    }
  }
  
  // Kombine skor: 40% Local + 60% DFS
  const score = (Math.min(100, localScore) * 0.4) + (dfsScore * 0.6);
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Link Score (S_link) - DFS backlink_summary (Global)
 * 
 * Mantık: Domain Authority (DFS) değerine göre normalize et
 * 
 * @param backlinkSummary - DFS backlink_summary verisi
 * @returns 0-100 arası Link Score
 */
function calculateLinkScore(backlinkSummary: any): number {
  if (!backlinkSummary?.tasks?.[0]?.result?.[0]) {
    return 0;
  }
  
  const result = backlinkSummary.tasks[0].result[0];
  const backlinks = result.backlinks || 0;
  const domains = result.domains || 0;
  
  // Domain Authority normalize etme (0-100)
  let score = 0;
  
  if (backlinks > 0 && domains > 0) {
    // Logaritmik normalizasyon
    const avgBacklinks = backlinks / domains;
    score = Math.log10(avgBacklinks + 1) * 20; // 0-100 arası
  }
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Schema Score (S_schema) - CF Worker
 * 
 * Mantık: JSON-LD hatasız ise +100, yoksa 0
 * 
 * @param localAudit - Local Audit verisi
 * @returns 0-100 arası Schema Score
 */
function calculateSchemaScore(localAudit: LocalAuditResponse): number {
  if (!localAudit.schema) {
    return 0;
  }
  
  let score = 0;
  
  // JSON-LD hatasız ise +100
  if (localAudit.schema.jsonLd === true && !localAudit.schema.jsonLdErrors?.length) {
    score = 100;
  } else if (localAudit.schema.jsonLd === true && localAudit.schema.jsonLdErrors?.length) {
    // Hatalar varsa, hata sayısına göre puan kır
    const errorCount = localAudit.schema.jsonLdErrors.length;
    score = Math.max(0, 100 - (errorCount * 20)); // Her hata -20 puan
  }
  
  // Schema types varsa bonus
  if (localAudit.schema.schemaTypes && localAudit.schema.schemaTypes.length > 0) {
    score = Math.min(100, score + (localAudit.schema.schemaTypes.length * 5));
  }
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Monetization Score (S_mon) - DFS ranked_keywords
 * 
 * Mantık: CPC değeri yüksek kelimelerde var mı?
 * 
 * @param rankedKeywords - DFS ranked_keywords verisi
 * @returns 0-100 arası Monetization Score
 */
function calculateMonetizationScore(rankedKeywords: any): number {
  if (!rankedKeywords?.tasks?.[0]?.result?.[0]?.items) {
    return 0;
  }
  
  const items = rankedKeywords.tasks[0].result[0].items;
  
  // CPC değeri yüksek kelimelerde var mı?
  const highCpcKeywords = items.filter((item: any) => {
    const cpc = item.cpc || item.cpc_top || 0;
    return cpc >= 5; // $5+ CPC
  });
  
  const totalKeywords = items.length;
  
  if (totalKeywords === 0) {
    return 0;
  }
  
  // Yüksek CPC kelime oranı
  const ratio = highCpcKeywords.length / totalKeywords;
  const score = ratio * 100;
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * E-EAT Score (S_eeat) - DFS domain_intersection + Local Audit
 * 
 * Mantık: Rakiplerle kesişim gücü + Yazar/About sayfası var mı?
 * 
 * @param domainIntersection - DFS domain_intersection verisi
 * @param localAudit - Local Audit verisi
 * @returns 0-100 arası E-EAT Score
 */
function calculateEeatScore(
  domainIntersection: any,
  localAudit: LocalAuditResponse
): number {
  let score = 0;
  
  // Local Audit: E-EAT sinyalleri
  if (localAudit.eeat) {
    if (localAudit.eeat.authorPage) score += 25;
    if (localAudit.eeat.aboutPage) score += 25;
    if (localAudit.eeat.contactPage) score += 25;
  }
  
  // DFS: Domain Intersection (rakiplerle kesişim gücü)
  if (domainIntersection?.tasks?.[0]?.result?.[0]?.items) {
    const items = domainIntersection.tasks[0].result[0].items;
    if (items.length > 0) {
      // Ortak kelime sayısına göre puan
      const avgCommonKeywords = items.reduce((sum: number, item: any) => {
        return sum + (item.common_keywords || 0);
      }, 0) / items.length;
      
      score += Math.min(25, avgCommonKeywords / 10); // Max 25 puan
    }
  }
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Freshness Score (S_fresh) - Local Audit + DFS historical
 * 
 * Mantık: last-modified header'ı 30 günden eskiyse puan kır
 * 
 * @param localAudit - Local Audit verisi
 * @param historicalData - DFS historical_rank_overview verisi
 * @returns 0-100 arası Freshness Score
 */
function calculateFreshnessScore(
  localAudit: LocalAuditResponse,
  historicalData: any
): number {
  let score = 100;
  
  // Local Audit: last-modified header
  if (localAudit.performance?.lastModified) {
    try {
      const lastModified = new Date(localAudit.performance.lastModified);
      const daysSince = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
      
      // 30 günden eskiyse puan kır
      if (daysSince > 30) {
        score -= Math.min(50, (daysSince - 30) * 2); // Her gün -2 puan, max -50
      }
    } catch (error) {
      console.error("Freshness score hesaplama hatası:", error);
    }
  }
  
  // DFS: Historical data'dan trend analizi (opsiyonel)
  // TODO: Trend analizi eklenebilir
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Viral Score (S_viral) - CF Worker
 * 
 * Mantık: OG Image ve Twitter Card tam ise 100 puan
 * 
 * @param localAudit - Local Audit verisi
 * @returns 0-100 arası Viral Score
 */
function calculateViralScore(localAudit: LocalAuditResponse): number {
  let score = 0;
  
  // OG Image ve Twitter Card tam ise 100 puan
  if (localAudit.meta?.ogImage && localAudit.meta?.twitterImage) {
    score = 100;
  } else if (localAudit.meta?.ogImage || localAudit.meta?.twitterImage) {
    score = 50; // Bir tanesi varsa 50 puan
  }
  
  // OG Title ve Description varsa bonus
  if (localAudit.meta?.ogTitle && localAudit.meta?.ogDescription) {
    score = Math.min(100, score + 20);
  }
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * UX Score (S_ux) - CF Worker (Browser Rendering)
 * 
 * Mantık: LCP < 2.5s ise tam puan
 * 
 * @param localAudit - Local Audit verisi
 * @returns 0-100 arası UX Score
 */
function calculateUxScore(localAudit: LocalAuditResponse): number {
  let score = 100;
  
  // LCP < 2.5s ise tam puan
  if (localAudit.performance?.lcp) {
    if (localAudit.performance.lcp > 2500) {
      // 2.5s'den yavaşsa puan kır
      const slowBy = localAudit.performance.lcp - 2500;
      score -= Math.min(50, slowBy / 100); // Her 100ms -1 puan, max -50
    }
  }
  
  // TTFB kontrolü
  if (localAudit.performance?.ttfb) {
    if (localAudit.performance.ttfb > 800) {
      // 800ms'den yavaşsa puan kır
      const slowBy = localAudit.performance.ttfb - 800;
      score -= Math.min(30, slowBy / 50); // Her 50ms -1 puan, max -30
    }
  }
  
  // Content Size kontrolü
  if (localAudit.performance?.contentSize) {
    const sizeMB = localAudit.performance.contentSize / (1024 * 1024);
    if (sizeMB > 5) {
      // 5MB'den büyükse puan kır
      score -= Math.min(20, (sizeMB - 5) * 4); // Her MB -4 puan, max -20
    }
  }
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Global Score (S_global) - Hesaplanan Ağırlıklı Skor
 * 
 * Mantık: Ağırlıklı Ortalama: Σ(ω · S)
 * 
 * @param scores - 10 alt skor
 * @returns 0-100 arası Global Score
 */
function calculateGlobalScore(scores: {
  s_tech: number;
  s_sem: number;
  s_link: number;
  s_schema: number;
  s_mon: number;
  s_eeat: number;
  s_fresh: number;
  s_viral: number;
  s_ux: number;
}): number {
  // Ağırlıklar (ω)
  const weights: Record<string, number> = {
    s_tech: 0.15,   // 15%
    s_sem: 0.20,    // 20%
    s_link: 0.15,   // 15%
    s_schema: 0.10, // 10%
    s_mon: 0.10,    // 10%
    s_eeat: 0.10,   // 10%
    s_fresh: 0.05,  // 5%
    s_viral: 0.05,  // 5%
    s_ux: 0.10,     // 10%
  };
  
  // Ağırlıklı ortalama: Σ(ω · S)
  let globalScore = 0;
  
  for (const [key, weight] of Object.entries(weights)) {
    const score = scores[key as keyof typeof scores] || 0;
    globalScore += weight * score;
  }
  
  return Math.round(Math.max(0, Math.min(100, globalScore)));
}

/**
 * SEO Fixes Listesi Oluştur
 * 
 * @param localAudit - Local Audit verisi
 * @returns SeoFix[] dizisi (önceliklendirilmiş)
 */
function generateSeoFixes(localAudit: LocalAuditResponse): SeoFix[] {
  const fixes: SeoFix[] = [];
  
  // H1 eksikse
  if (!localAudit.meta?.h1 || localAudit.meta.h1.trim() === '') {
    fixes.push({
      code: 'NO_H1',
      priority: 'HIGH',
      message: 'H1 etiketi eksik. Ana başlık ekleyin.',
      scoreImpact: 10,
      category: 'TECHNICAL',
    });
  }
  
  // Canonical eksikse
  if (!localAudit.meta?.canonical) {
    fixes.push({
      code: 'MISSING_CANONICAL',
      priority: 'HIGH',
      message: 'Canonical etiketi eksik. Duplicate content önlemek için ekleyin.',
      scoreImpact: 10,
      category: 'TECHNICAL',
    });
  }
  
  // SSL yoksa
  if (localAudit.technical?.ssl === false) {
    fixes.push({
      code: 'SSL_MISSING',
      priority: 'HIGH',
      message: 'SSL sertifikası bulunamadı. Güvenlik için SSL ekleyin.',
      scoreImpact: 20,
      category: 'TECHNICAL',
    });
  }
  
  // Title eksikse
  if (!localAudit.meta?.title || localAudit.meta.title.trim() === '') {
    fixes.push({
      code: 'MISSING_TITLE',
      priority: 'HIGH',
      message: 'Title etiketi eksik. SEO için title ekleyin.',
      scoreImpact: 5,
      category: 'TECHNICAL',
    });
  }
  
  // Description eksikse
  if (!localAudit.meta?.description || localAudit.meta.description.trim() === '') {
    fixes.push({
      code: 'MISSING_DESCRIPTION',
      priority: 'MEDIUM',
      message: 'Meta description eksik. SEO için description ekleyin.',
      scoreImpact: 5,
      category: 'TECHNICAL',
    });
  }
  
  // JSON-LD hatası varsa
  if (localAudit.schema?.jsonLdErrors && localAudit.schema.jsonLdErrors.length > 0) {
    fixes.push({
      code: 'SCHEMA_ERRORS',
      priority: 'MEDIUM',
      message: `JSON-LD şemada ${localAudit.schema.jsonLdErrors.length} hata bulundu.`,
      scoreImpact: localAudit.schema.jsonLdErrors.length * 5,
      category: 'SCHEMA',
    });
  }
  
  // JSON-LD yoksa
  if (localAudit.schema?.jsonLd === false || !localAudit.schema?.jsonLd) {
    fixes.push({
      code: 'NO_JSON_LD',
      priority: 'MEDIUM',
      message: 'JSON-LD şema yapılandırması bulunamadı. Schema.org için JSON-LD ekleyin.',
      scoreImpact: 20,
      category: 'SCHEMA',
    });
  }
  
  // OG Image eksikse
  if (!localAudit.meta?.ogImage) {
    fixes.push({
      code: 'MISSING_OG_IMAGE',
      priority: 'MEDIUM',
      message: 'Open Graph Image eksik. Sosyal medya paylaşımları için OG Image ekleyin.',
      scoreImpact: 10,
      category: 'OTHER',
    });
  }
  
  // Twitter Card eksikse
  if (!localAudit.meta?.twitterImage) {
    fixes.push({
      code: 'MISSING_TWITTER_CARD',
      priority: 'LOW',
      message: 'Twitter Card Image eksik. Twitter paylaşımları için Twitter Card ekleyin.',
      scoreImpact: 10,
      category: 'OTHER',
    });
  }
  
  // LCP yavaşsa
  if (localAudit.performance?.lcp && localAudit.performance.lcp > 2500) {
    fixes.push({
      code: 'SLOW_LCP',
      priority: 'HIGH',
      message: `LCP (Largest Contentful Paint) çok yavaş: ${(localAudit.performance.lcp / 1000).toFixed(1)}s. 2.5s altına indirin.`,
      scoreImpact: Math.min(50, (localAudit.performance.lcp - 2500) / 100),
      category: 'PERFORMANCE',
    });
  }
  
  // TTFB yavaşsa
  if (localAudit.performance?.ttfb && localAudit.performance.ttfb > 800) {
    fixes.push({
      code: 'SLOW_TTFB',
      priority: 'MEDIUM',
      message: `TTFB (Time to First Byte) yavaş: ${localAudit.performance.ttfb}ms. 800ms altına indirin.`,
      scoreImpact: Math.min(30, (localAudit.performance.ttfb - 800) / 50),
      category: 'PERFORMANCE',
    });
  }
  
  // Content Size büyükse
  if (localAudit.performance?.contentSize) {
    const sizeMB = localAudit.performance.contentSize / (1024 * 1024);
    if (sizeMB > 5) {
      fixes.push({
        code: 'LARGE_CONTENT_SIZE',
        priority: 'MEDIUM',
        message: `Sayfa boyutu çok büyük: ${sizeMB.toFixed(2)}MB. 5MB altına indirin.`,
        scoreImpact: Math.min(20, (sizeMB - 5) * 4),
        category: 'PERFORMANCE',
      });
    }
  }
  
  // E-EAT sinyalleri eksikse
  if (localAudit.eeat) {
    if (!localAudit.eeat.authorPage) {
      fixes.push({
        code: 'MISSING_AUTHOR_PAGE',
        priority: 'LOW',
        message: 'Yazar sayfası bulunamadı. E-EAT için yazar sayfası ekleyin.',
        scoreImpact: 8,
        category: 'OTHER',
      });
    }
    
    if (!localAudit.eeat.aboutPage) {
      fixes.push({
        code: 'MISSING_ABOUT_PAGE',
        priority: 'LOW',
        message: 'Hakkımızda sayfası bulunamadı. Güven için About sayfası ekleyin.',
        scoreImpact: 8,
        category: 'OTHER',
      });
    }
    
    if (!localAudit.eeat.contactPage) {
      fixes.push({
        code: 'MISSING_CONTACT_PAGE',
        priority: 'LOW',
        message: 'İletişim sayfası bulunamadı. Güven için Contact sayfası ekleyin.',
        scoreImpact: 8,
        category: 'OTHER',
      });
    }
  }
  
  // Önceliğe göre sırala
  const priorityOrder: Record<string, number> = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
  fixes.sort((a, b) => {
    return (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999);
  });
  
  return fixes;
}

/**
 * @deprecated Bu fonksiyon v2.0'da kaldırıldı. 10 boyutlu skorlama sistemi kullanın.
 * Yeni sistem: calculateTechnicalScore, calculateSemanticScore, etc. + calculateGlobalScore
 * 
 * Snappost Authority Score hesaplama (Eski Sistem)
 * 
 * Formül:
 * - Baz Puan: Log10(Traffic Value) * 10
 * - Kalite Bonusu: (Top 3 Keyword / Top 100 Keyword) * 20
 * - Trend Bonusu: Is_Up > Is_Down ise +5 puan
 * - Sonucu 0-100 arasına sıkıştır
 * 
 * @param metrics - Detaylı metrikler (trafficData, detailedMetrics)
 * @returns 0-100 arası Snappost Score
 */
function calculateSnappostScore(metrics: {
  trafficData?: { estimatedTrafficValue?: number };
  detailedMetrics?: {
    pos_1?: number;
    pos_2_3?: number;
    pos_4_10?: number;
    pos_11_100?: number;
    is_new?: number;
    is_lost?: number;
    total_keywords?: number;
  };
}): number {
  const trafficValue = metrics.trafficData?.estimatedTrafficValue || 0;
  const detailed = metrics.detailedMetrics || {};
  
  // 1. Baz Puan: Logaritmik hesaplama (Traffic 100'den 100M'ye kadar olabilir)
  let baseScore = 0;
  if (trafficValue > 0) {
    baseScore = Math.log10(trafficValue) * 10;
  }
  
  // 2. Kalite Bonusu: Top 3'teki kelime oranı
  const top3Keywords = (detailed.pos_1 || 0) + (detailed.pos_2_3 || 0);
  const top100Keywords = (detailed.pos_1 || 0) + (detailed.pos_2_3 || 0) + 
                         (detailed.pos_4_10 || 0) + (detailed.pos_11_100 || 0);
  
  let qualityBonus = 0;
  if (top100Keywords > 0) {
    const top3Ratio = top3Keywords / top100Keywords;
    qualityBonus = top3Ratio * 20; // Max 20 puan
  }
  
  // 3. Trend Bonusu: Yeni kelimeler > Kayıp kelimeler ise +5
  const trendBonus = (detailed.is_new || 0) > (detailed.is_lost || 0) ? 5 : 0;
  
  // Toplam puan
  let totalScore = baseScore + qualityBonus + trendBonus;
  
  // 0-100 arasına sıkıştır
  totalScore = Math.max(0, Math.min(100, totalScore));
  
  return Math.round(totalScore);
}

interface AnalyzeSiteResult {
  success: boolean;
  siteId: string;
  creditsRemaining: number;
  message?: string;
}

/**
 * Site SEO analizi yapar
 * 
 * İşlem adımları:
 * 1. Ajansın kredisi var mı kontrol et
 * 2. Domain validasyonu
 * 3. DataForSEO API'den veri çek (locationCode ile)
 * 4. Transaction ile Site güncelle + Kredi düş + Log kaydı
 * 
 * @param siteId - Analiz edilecek site ID
 * @param agencyId - İşlemi yapan ajans ID (User ID, role='AGENCY')
 * @param locationCode - ZORUNLU: Ülke lokasyon kodu (örn: 2840=US, 2792=TR)
 * @returns Analiz sonucu
 * @throws Error - Kredi yetersiz, API hatası, vb.
 */
export async function analyzeSite(
  siteId: string,
  agencyId: string,
  locationCode: number
): Promise<AnalyzeSiteResult> {
  // 1. Ajans kontrolü ve kredi kontrolü
  const agency = await prisma.user.findUnique({
    where: { id: agencyId },
    select: { id: true, role: true, credits: true },
  });

  if (!agency) {
    throw new Error('Ajans bulunamadı');
  }

  if (agency.role !== 'AGENCY') {
    throw new Error('Bu işlem sadece ajanslar tarafından yapılabilir');
  }

  const CREDIT_COST = 1; // Her SEO analizi için 1 kredi
  if (agency.credits < CREDIT_COST) {
    throw new Error(
      `Yetersiz kredi. Mevcut kredi: ${agency.credits}, Gerekli: ${CREDIT_COST}`
    );
  }

  // 2. Site bilgilerini al
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true, domain: true },
  });

  if (!site) {
    throw new Error('Site bulunamadı');
  }

  // 3. Domain validasyonu
  if (!validateDomain(site.domain)) {
    throw new Error(`Geçersiz domain: ${site.domain}`);
  }

  // 4. LocationCode kontrolü
  if (!locationCode || locationCode <= 0) {
    throw new Error('Location code zorunludur ve geçerli bir değer olmalıdır');
  }

  // ============================================
  // PHASE 0: LOCAL AUDIT (CF Worker) - 0 KREDİ
  // ============================================
  console.log(`🔍 [PHASE 0] Local Audit başlatılıyor - Site: ${site.domain}, Location: ${locationCode}`);
  
  const siteUrl = `https://${site.domain}`;
  let localAuditResult;
  
  try {
    localAuditResult = await fetchAndStoreLocalAudit(siteId, siteUrl, locationCode);
    
    if (localAuditResult.success && localAuditResult.localAuditData) {
      console.log("✅ [PHASE 0] Local Audit başarılı");
      
      // Opsiyonel: Kritik eşik kontrolü (şu an devre dışı)
      // const LOCAL_AUDIT_THRESHOLD = Number(process.env.LOCAL_AUDIT_THRESHOLD) || 30;
      // const technicalScore = calculateTechnicalScore(localAuditResult.localAuditData);
      // if (technicalScore < LOCAL_AUDIT_THRESHOLD) {
      //   console.warn(`⚠️ [PHASE 0] Technical score kritik eşiğin altında: ${technicalScore}`);
      //   // İşlemi durdurmayız (non-blocking), sadece log
      // }
    } else {
      console.warn("⚠️ [PHASE 0] Local Audit başarısız, Phase 1 devam edecek");
    }
  } catch (error: any) {
    console.error("❌ [PHASE 0] Local Audit hatası:", error.message);
    // Hata olsa bile Phase 1 devam eder (non-blocking)
  }

  // ============================================
  // PHASE 1: DATAFORSEO API - 1 KREDİ (MEVCUT)
  // ============================================
  console.log(`📊 [PHASE 1] DataForSEO analizi başlatılıyor - Site: ${site.domain}, Location: ${locationCode}`);
  
  let rawSeoData;
  try {
    rawSeoData = await fetchSeoData(site.domain, locationCode);
    console.log("✅ [SERVICE] API'den gelen HAM veri kaydediliyor (işleme yapılmıyor)");
  } catch (error: any) {
    console.error("❌ [SERVICE] API hatası:", error);
    throw new Error(`SEO verisi alınamadı: ${error.message}`);
  }

  if (!rawSeoData) {
    console.error("❌ [SERVICE] SEO verisi null döndü");
    throw new Error('SEO verisi alınamadı: API yanıtı boş');
  }

  // ============================================
  // DATA MERGE: Local Audit + DataForSEO
  // ============================================
  console.log("💾 [SERVICE] HAM veri veritabanına kaydediliyor (rawSeoData)");
  
  // Multi-Region Storage: Veriyi location code'a göre grupla
  const rawLocationCode = rawSeoData._metadata?.locationCode;
  const locationKey = rawLocationCode ? String(rawLocationCode) : 'global';
  const apiName = rawSeoData._metadata?.api || 'historical_rank_overview';

  // Mevcut rawSeoData'yı al
  const existingSite = await prisma.site.findUnique({
    where: { id: siteId },
    select: { rawSeoData: true },
  });

  let updatedRawSeoData: any = existingSite?.rawSeoData || {};
  
  // Eski format kontrolü (tasks dizisi varsa yeni formata çevir)
  if (updatedRawSeoData.tasks && Array.isArray(updatedRawSeoData.tasks)) {
    console.log("🔄 [SERVICE] Eski format tespit edildi, yeni formata çevriliyor...");
    updatedRawSeoData = {};
  }

  // Location kutusu yoksa oluştur
  if (!updatedRawSeoData[locationKey]) {
    updatedRawSeoData[locationKey] = {};
  }

  // Eğer Local Audit başarılıysa, onu da ekle (Phase 0)
  if (localAuditResult?.success && localAuditResult.updatedRawSeoData) {
    const localAuditLocationData = localAuditResult.updatedRawSeoData[locationKey];
    if (localAuditLocationData?.local_audit) {
      updatedRawSeoData[locationKey]['local_audit'] = localAuditLocationData.local_audit;
      console.log(`✅ [SERVICE] Local Audit verisi merge edildi - Location: ${locationKey}`);
    }
  }

  // DataForSEO verisini ekle (Phase 1 - mevcut mantık)
  updatedRawSeoData[locationKey][apiName] = {
    data: rawSeoData,
    timestamp: rawSeoData._metadata?.fetchedAt || new Date().toISOString()
  };

  // Veri boyutunu kontrol et
  const rawDataString = JSON.stringify(updatedRawSeoData);
  const dataSizeKB = (rawDataString.length / 1024).toFixed(2);
  const locationCount = Object.keys(updatedRawSeoData).length;
  console.log(`📦 [SERVICE] Kaydedilecek veri boyutu: ${dataSizeKB} KB`);
  console.log(`📊 [SERVICE] Location sayısı: ${locationCount} (${locationKey} güncellendi)`);
  
  const result = await prisma.$transaction(async (tx) => {
    // Site'i güncelle - tasks dizisine eklenmiş veriyi kaydet
    const updatedSite = await tx.site.update({
      where: { id: siteId },
      data: {
        rawSeoData: updatedRawSeoData, // Tasks dizisine eklenmiş ham veri
        lastSeoCheck: new Date(),
        // İşlenmiş verileri temizle (reprocessData ile yeniden hesaplanacak)
        snappostScore: null,
        trafficData: undefined, // Prisma Json tipi için undefined kullan
      },
    });
    
    // Kayıt sonrası kontrol
    const savedDataString = JSON.stringify(updatedSite.rawSeoData);
    const savedSizeKB = (savedDataString.length / 1024).toFixed(2);
    const savedData = updatedSite.rawSeoData as any;
    const savedLocationCount = savedData ? Object.keys(savedData).length : 0;
    console.log(`✅ [SERVICE] HAM veri kaydedildi - Veritabanındaki boyut: ${savedSizeKB} KB`);
    console.log(`📊 [SERVICE] Toplam location sayısı: ${savedLocationCount}`);

    // Ajans kredisini düş
    const updatedAgency = await tx.user.update({
      where: { id: agencyId },
      data: {
        credits: {
          decrement: CREDIT_COST,
        },
      },
      select: { credits: true },
    });

    // Transaction log kaydı
    await tx.agencyTransaction.create({
      data: {
        agencyId: agencyId,
        amount: -CREDIT_COST, // Negatif: kredi kullanımı
        type: 'SEO_ANALYSIS',
        description: `SEO analizi: ${site.domain} (Site ID: ${siteId})`,
      },
    });

    return {
      site: updatedSite,
      agency: updatedAgency,
    };
  });

  console.log("🎉 [SERVICE] Transaction tamamlandı - Kalan kredi:", result.agency.credits);

  return {
    success: true,
    siteId: site.id,
    creditsRemaining: result.agency.credits,
    message: 'Ham SEO verisi başarıyla kaydedildi. Veriyi yeniden analiz etmek için "Veriyi Yeniden Analiz Et" butonuna tıklayın.',
  };
}

/**
 * Yeni API verisini mevcut rawSeoData'ya ekler (Multi-Region Storage)
 * 
 * Yeni Yapı:
 * {
 *   "2840": { // Location Code
 *     "historical_rank_overview": {...},
 *     "ranked_keywords": {...}
 *   },
 *   "2792": {
 *     "historical_rank_overview": {...}
 *   }
 * }
 * 
 * @param siteId - Site ID
 * @param newApiData - Yeni API yanıtı (metadata ile)
 * @returns Güncellenmiş rawSeoData
 */
async function appendApiDataToRawSeoData(siteId: string, newApiData: any) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { rawSeoData: true },
  });

  if (!site) {
    throw new Error('Site bulunamadı');
  }

  // API adını belirle
  const apiName = newApiData._metadata?.api || 'unknown';
  
  // Location code'u belirle (backlink API'leri için null olabilir)
  const apiLocationCode = newApiData._metadata?.locationCode;
  const locationKey = apiLocationCode ? String(apiLocationCode) : 'global';

  // Mevcut rawSeoData'yı al veya yeni yapı oluştur
  let existingData: any = site.rawSeoData || {};
  
  // Eski format kontrolü (tasks dizisi varsa yeni formata çevir)
  if (existingData.tasks && Array.isArray(existingData.tasks)) {
    console.log("🔄 [SERVICE] Eski format tespit edildi, yeni formata çevriliyor...");
    existingData = {};
    // Eski tasks'ları kaybetmek yerine, ilk location code'u kullan
    // Bu durumda sadece yeni veriyi ekleyeceğiz
  }

  // Location kutusu yoksa oluştur
  if (!existingData[locationKey]) {
    existingData[locationKey] = {};
  }

  // API verisini ilgili location kutusuna ekle
  existingData[locationKey][apiName] = {
    data: newApiData,
    timestamp: newApiData._metadata?.fetchedAt || new Date().toISOString()
  };

  console.log(`✅ [SERVICE] Veri eklendi - Location: ${locationKey}, API: ${apiName}`);

  return existingData;
}

/**
 * Local Audit (CF Worker) verisini çek ve rawSeoData'ya ekle
 * 
 * @param siteId - Site ID
 * @param url - Analiz edilecek URL (https://domain.com)
 * @param locationCode - Location code (UI'da seçilen)
 * @returns Güncellenmiş rawSeoData
 */
export async function fetchAndStoreLocalAudit(
  siteId: string,
  url: string,
  locationCode: number
): Promise<{
  success: boolean;
  localAuditData: LocalAuditResponse | null;
  updatedRawSeoData: any;
}> {
  console.log(`🔍 [LOCAL AUDIT] Başlatılıyor - SiteID: ${siteId}, URL: ${url}, Location: ${locationCode}`);
  
  // 1. CF Worker'a istek at (0 kredi)
  const localAuditData = await fetchLocalAudit(url);
  
  if (!localAuditData) {
    console.error("❌ [LOCAL AUDIT] Veri alınamadı");
    return {
      success: false,
      localAuditData: null,
      updatedRawSeoData: null,
    };
  }
  
  console.log("✅ [LOCAL AUDIT] Veri alındı");
  
  // 2. Mevcut rawSeoData'yı al
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { rawSeoData: true },
  });
  
  if (!site) {
    throw new Error('Site bulunamadı');
  }
  
  // 3. Multi-Region Storage formatına ekle
  let existingData: any = site.rawSeoData || {};
  
  // Eski format kontrolü
  if (existingData.tasks && Array.isArray(existingData.tasks)) {
    console.log("🔄 [LOCAL AUDIT] Eski format tespit edildi, yeni formata çevriliyor...");
    existingData = {};
  }
  
  const locationKey = String(locationCode);
  
  // Location kutusu yoksa oluştur
  if (!existingData[locationKey]) {
    existingData[locationKey] = {};
  }
  
  // Local Audit verisini ekle
  existingData[locationKey]['local_audit'] = {
    data: localAuditData,
    timestamp: localAuditData._metadata?.fetchedAt || new Date().toISOString(),
  };
  
  console.log(`✅ [LOCAL AUDIT] Veri eklendi - Location: ${locationKey}`);
  
  return {
    success: true,
    localAuditData: localAuditData,
    updatedRawSeoData: existingData,
  };
}

/**
 * Ranked Keywords API'yi çağır ve rawSeoData'ya ekle
 */
export async function fetchAndStoreRankedKeywords(
  siteId: string,
  agencyId: string,
  locationCode: number
): Promise<AnalyzeSiteResult> {
  const CREDIT_COST = 1;
  
  // Kredi kontrolü
  const agency = await prisma.user.findUnique({
    where: { id: agencyId },
    select: { id: true, role: true, credits: true },
  });

  if (!agency || agency.role !== 'AGENCY' || agency.credits < CREDIT_COST) {
    throw new Error('Yetersiz kredi veya geçersiz ajans');
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true, domain: true },
  });

  if (!site) {
    throw new Error('Site bulunamadı');
  }

  const apiData = await fetchRankedKeywords(site.domain, locationCode);
  if (!apiData) {
    throw new Error('Ranked Keywords verisi alınamadı');
  }

  const updatedRawSeoData = await appendApiDataToRawSeoData(siteId, apiData);

  const result = await prisma.$transaction(async (tx) => {
    const updatedSite = await tx.site.update({
      where: { id: siteId },
      data: { rawSeoData: updatedRawSeoData },
    });

    const updatedAgency = await tx.user.update({
      where: { id: agencyId },
      data: { credits: { decrement: CREDIT_COST } },
      select: { credits: true },
    });

    await tx.agencyTransaction.create({
      data: {
        agencyId: agencyId,
        amount: -CREDIT_COST,
        type: 'SEO_ANALYSIS',
        description: `Ranked Keywords: ${site.domain}`,
      },
    });

    return { site: updatedSite, agency: updatedAgency };
  });

  return {
    success: true,
    siteId: site.id,
    creditsRemaining: result.agency.credits,
    message: 'Ranked Keywords verisi başarıyla eklendi',
  };
}

/**
 * SERP Competitors API'yi çağır ve rawSeoData'ya ekle
 */
export async function fetchAndStoreSerpCompetitors(
  siteId: string,
  agencyId: string,
  locationCode: number
): Promise<AnalyzeSiteResult> {
  const CREDIT_COST = 1;
  
  const agency = await prisma.user.findUnique({
    where: { id: agencyId },
    select: { id: true, role: true, credits: true },
  });

  if (!agency || agency.role !== 'AGENCY' || agency.credits < CREDIT_COST) {
    throw new Error('Yetersiz kredi veya geçersiz ajans');
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true, domain: true },
  });

  if (!site) {
    throw new Error('Site bulunamadı');
  }

  const apiData = await fetchSerpCompetitors(site.domain, locationCode);
  if (!apiData) {
    throw new Error('SERP Competitors verisi alınamadı');
  }

  const updatedRawSeoData = await appendApiDataToRawSeoData(siteId, apiData);

  const result = await prisma.$transaction(async (tx) => {
    const updatedSite = await tx.site.update({
      where: { id: siteId },
      data: { rawSeoData: updatedRawSeoData },
    });

    const updatedAgency = await tx.user.update({
      where: { id: agencyId },
      data: { credits: { decrement: CREDIT_COST } },
      select: { credits: true },
    });

    await tx.agencyTransaction.create({
      data: {
        agencyId: agencyId,
        amount: -CREDIT_COST,
        type: 'SEO_ANALYSIS',
        description: `SERP Competitors: ${site.domain}`,
      },
    });

    return { site: updatedSite, agency: updatedAgency };
  });

  return {
    success: true,
    siteId: site.id,
    creditsRemaining: result.agency.credits,
    message: 'SERP Competitors verisi başarıyla eklendi',
  };
}

/**
 * Relevant Pages API'yi çağır ve rawSeoData'ya ekle
 */
export async function fetchAndStoreRelevantPages(
  siteId: string,
  agencyId: string,
  locationCode: number
): Promise<AnalyzeSiteResult> {
  const CREDIT_COST = 1;
  
  const agency = await prisma.user.findUnique({
    where: { id: agencyId },
    select: { id: true, role: true, credits: true },
  });

  if (!agency || agency.role !== 'AGENCY' || agency.credits < CREDIT_COST) {
    throw new Error('Yetersiz kredi veya geçersiz ajans');
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true, domain: true },
  });

  if (!site) {
    throw new Error('Site bulunamadı');
  }

  const apiData = await fetchRelevantPages(site.domain, locationCode);
  if (!apiData) {
    throw new Error('Relevant Pages verisi alınamadı');
  }

  const updatedRawSeoData = await appendApiDataToRawSeoData(siteId, apiData);

  const result = await prisma.$transaction(async (tx) => {
    const updatedSite = await tx.site.update({
      where: { id: siteId },
      data: { rawSeoData: updatedRawSeoData },
    });

    const updatedAgency = await tx.user.update({
      where: { id: agencyId },
      data: { credits: { decrement: CREDIT_COST } },
      select: { credits: true },
    });

    await tx.agencyTransaction.create({
      data: {
        agencyId: agencyId,
        amount: -CREDIT_COST,
        type: 'SEO_ANALYSIS',
        description: `Relevant Pages: ${site.domain}`,
      },
    });

    return { site: updatedSite, agency: updatedAgency };
  });

  return {
    success: true,
    siteId: site.id,
    creditsRemaining: result.agency.credits,
    message: 'Relevant Pages verisi başarıyla eklendi',
  };
}

/**
 * Domain Intersection API'yi çağır ve rawSeoData'ya ekle
 */
export async function fetchAndStoreDomainIntersection(
  siteId: string,
  agencyId: string,
  locationCode: number
): Promise<AnalyzeSiteResult> {
  const CREDIT_COST = 1;
  
  const agency = await prisma.user.findUnique({
    where: { id: agencyId },
    select: { id: true, role: true, credits: true },
  });

  if (!agency || agency.role !== 'AGENCY' || agency.credits < CREDIT_COST) {
    throw new Error('Yetersiz kredi veya geçersiz ajans');
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true, domain: true },
  });

  if (!site) {
    throw new Error('Site bulunamadı');
  }

  const apiData = await fetchDomainIntersection(site.domain, locationCode);
  if (!apiData) {
    throw new Error('Domain Intersection verisi alınamadı');
  }

  const updatedRawSeoData = await appendApiDataToRawSeoData(siteId, apiData);

  const result = await prisma.$transaction(async (tx) => {
    const updatedSite = await tx.site.update({
      where: { id: siteId },
      data: { rawSeoData: updatedRawSeoData },
    });

    const updatedAgency = await tx.user.update({
      where: { id: agencyId },
      data: { credits: { decrement: CREDIT_COST } },
      select: { credits: true },
    });

    await tx.agencyTransaction.create({
      data: {
        agencyId: agencyId,
        amount: -CREDIT_COST,
        type: 'SEO_ANALYSIS',
        description: `Domain Intersection: ${site.domain}`,
      },
    });

    return { site: updatedSite, agency: updatedAgency };
  });

  return {
    success: true,
    siteId: site.id,
    creditsRemaining: result.agency.credits,
    message: 'Domain Intersection verisi başarıyla eklendi',
  };
}

/**
 * Backlink Summary API'yi çağır ve rawSeoData'ya ekle
 */
export async function fetchAndStoreBacklinkSummary(
  siteId: string,
  agencyId: string
): Promise<AnalyzeSiteResult> {
  const CREDIT_COST = 1;
  
  const agency = await prisma.user.findUnique({
    where: { id: agencyId },
    select: { id: true, role: true, credits: true },
  });

  if (!agency || agency.role !== 'AGENCY' || agency.credits < CREDIT_COST) {
    throw new Error('Yetersiz kredi veya geçersiz ajans');
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true, domain: true },
  });

  if (!site) {
    throw new Error('Site bulunamadı');
  }

  const apiData = await fetchBacklinkSummary(site.domain);
  if (!apiData) {
    throw new Error('Backlink Summary verisi alınamadı');
  }

  const updatedRawSeoData = await appendApiDataToRawSeoData(siteId, apiData);

  const result = await prisma.$transaction(async (tx) => {
    const updatedSite = await tx.site.update({
      where: { id: siteId },
      data: { rawSeoData: updatedRawSeoData },
    });

    const updatedAgency = await tx.user.update({
      where: { id: agencyId },
      data: { credits: { decrement: CREDIT_COST } },
      select: { credits: true },
    });

    await tx.agencyTransaction.create({
      data: {
        agencyId: agencyId,
        amount: -CREDIT_COST,
        type: 'SEO_ANALYSIS',
        description: `Backlink Summary: ${site.domain}`,
      },
    });

    return { site: updatedSite, agency: updatedAgency };
  });

  return {
    success: true,
    siteId: site.id,
    creditsRemaining: result.agency.credits,
    message: 'Backlink Summary verisi başarıyla eklendi',
  };
}

/**
 * Backlink History API'yi çağır ve rawSeoData'ya ekle
 */
export async function fetchAndStoreBacklinkHistory(
  siteId: string,
  agencyId: string
): Promise<AnalyzeSiteResult> {
  const CREDIT_COST = 1;
  
  const agency = await prisma.user.findUnique({
    where: { id: agencyId },
    select: { id: true, role: true, credits: true },
  });

  if (!agency || agency.role !== 'AGENCY' || agency.credits < CREDIT_COST) {
    throw new Error('Yetersiz kredi veya geçersiz ajans');
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true, domain: true },
  });

  if (!site) {
    throw new Error('Site bulunamadı');
  }

  const apiData = await fetchBacklinkHistory(site.domain);
  if (!apiData) {
    throw new Error('Backlink History verisi alınamadı');
  }

  const updatedRawSeoData = await appendApiDataToRawSeoData(siteId, apiData);

  const result = await prisma.$transaction(async (tx) => {
    const updatedSite = await tx.site.update({
      where: { id: siteId },
      data: { rawSeoData: updatedRawSeoData },
    });

    const updatedAgency = await tx.user.update({
      where: { id: agencyId },
      data: { credits: { decrement: CREDIT_COST } },
      select: { credits: true },
    });

    await tx.agencyTransaction.create({
      data: {
        agencyId: agencyId,
        amount: -CREDIT_COST,
        type: 'SEO_ANALYSIS',
        description: `Backlink History: ${site.domain}`,
      },
    });

    return { site: updatedSite, agency: updatedAgency };
  });

  return {
    success: true,
    siteId: site.id,
    creditsRemaining: result.agency.credits,
    message: 'Backlink History verisi başarıyla eklendi',
  };
}

/**
 * Ham SEO verisini işle ve analiz et (Raw-Analysis-Push Mimarisi - Hybrid SEO Engine v2.0)
 * 
 * Bu fonksiyon API'ye gitmez, sadece veritabanındaki rawSeoData'yı alır,
 * 10 boyutlu skorlama algoritmalarını çalıştırır ve işlenmiş verileri kaydeder.
 * 
 * @param siteId - İşlenecek site ID
 * @param locationCode - İşlenecek location code (opsiyonel, yoksa ilk location kullanılır)
 * @returns İşleme sonucu (10 skor + seoFixes)
 */
export async function reprocessSeoData(siteId: string, locationCode?: number): Promise<{
  success: boolean;
  snappostScore: number | null;
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
  seoFixes: SeoFix[];
  trafficData: any;
  message: string;
}> {
  console.log(`🔄 [REPROCESS] Veri yeniden işleniyor - SiteID: ${siteId}, Location: ${locationCode || 'auto'}`);

  // 1. Site'i ve rawSeoData'yı al
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true, rawSeoData: true },
  });

  if (!site) {
    throw new Error('Site bulunamadı');
  }

  if (!site.rawSeoData) {
    throw new Error('Ham SEO verisi bulunamadı. Önce "SEO Metriklerini Yenile" butonuna tıklayın.');
  }

  // 2. Multi-Region Storage'dan veriyi çek
  const rawData = site.rawSeoData as any;
  
  // Location code belirtilmişse onu kullan, yoksa ilk location'ı kullan
  let locationKey: string;
  if (locationCode) {
    locationKey = String(locationCode);
  } else {
    // İlk location'ı bul
    const locationKeys = Object.keys(rawData).filter(key => key !== 'tasks');
    if (locationKeys.length === 0) {
      throw new Error('Ham veri formatı geçersiz veya location verisi yok');
    }
    locationKey = locationKeys[0];
    console.log(`📌 [REPROCESS] Location belirtilmedi, ilk location kullanılıyor: ${locationKey}`);
  }

  // Location kutusundan verileri al
  const locationData = rawData[locationKey];
  if (!locationData) {
    throw new Error(`Location ${locationKey} için veri bulunamadı`);
  }

  // 3. Local Audit verisini al (Phase 0)
  const localAudit = locationData.local_audit?.data as LocalAuditResponse | undefined;
  
  // 4. DFS verilerini al (Phase 1)
  const historicalData = locationData.historical_rank_overview?.data;
  const rankedKeywords = locationData.ranked_keywords?.data;
  const domainIntersection = locationData.domain_intersection?.data;
  
  // Global veriler (backlink API'leri)
  const backlinkSummary = rawData.global?.backlink_summary?.data || rawData['0']?.backlink_summary?.data;

  // Historical data kontrolü (en azından bu olmalı)
  if (!historicalData || !historicalData.tasks?.[0]?.result?.[0]) {
    throw new Error(`Location ${locationKey} için historical_rank_overview verisi bulunamadı`);
  }

  const historicalResult = historicalData.tasks[0].result[0];
  const latestItem = historicalResult.items?.[0];
  const metrics = latestItem?.metrics?.organic || {};

  // 5. 10 Skor Hesaplama
  const scores: {
    s_tech: number;
    s_sem: number;
    s_link: number;
    s_schema: number;
    s_mon: number;
    s_eeat: number;
    s_fresh: number;
    s_viral: number;
    s_ux: number;
  } = {
    s_tech: localAudit ? calculateTechnicalScore(localAudit) : 0,
    s_sem: (localAudit && rankedKeywords) ? calculateSemanticScore(localAudit, rankedKeywords) : 0,
    s_link: backlinkSummary ? calculateLinkScore(backlinkSummary) : 0,
    s_schema: localAudit ? calculateSchemaScore(localAudit) : 0,
    s_mon: rankedKeywords ? calculateMonetizationScore(rankedKeywords) : 0,
    s_eeat: (domainIntersection && localAudit) ? calculateEeatScore(domainIntersection, localAudit) : 0,
    s_fresh: (localAudit && historicalData) ? calculateFreshnessScore(localAudit, historicalData) : 0,
    s_viral: localAudit ? calculateViralScore(localAudit) : 0,
    s_ux: localAudit ? calculateUxScore(localAudit) : 0,
  };

  // 6. Global Skor Hesaplama (Ağırlıklı Ortalama)
  const s_global = calculateGlobalScore(scores);
  
  // 7. SEO Fixes Listesi Oluştur
  const seoFixes = localAudit ? generateSeoFixes(localAudit) : [];

  // 8. Traffic Data (Mevcut mantık - değişmez)
  const trafficData = {
    estimatedTrafficValue: metrics.etv || 0,
    history: historicalResult.items?.map((item: any) => ({
      date: `${item.year}-${item.month}`,
      value: item.metrics?.organic?.etv || 0
    })) || []
  };

  // 9. Veritabanına Kaydet (10 skor + seoFixes)
  await prisma.site.update({
    where: { id: siteId },
    data: {
      snappostScore: s_global, // Global skor artık snappostScore
      s_tech: scores.s_tech,
      s_sem: scores.s_sem,
      s_link: scores.s_link,
      s_schema: scores.s_schema,
      s_mon: scores.s_mon,
      s_eeat: scores.s_eeat,
      s_fresh: scores.s_fresh,
      s_viral: scores.s_viral,
      s_ux: scores.s_ux,
      s_global: s_global,
      seoFixes: seoFixes.length > 0 ? seoFixes as any : undefined, // JSON olarak kaydet
      trafficData: trafficData,
    },
  });

  console.log("✅ [REPROCESS] İşlenmiş veriler kaydedildi");
  console.log("📊 [REPROCESS] Skorlar:", scores);
  console.log("🌍 [REPROCESS] Global Skor:", s_global);
  console.log("🔧 [REPROCESS] Fix sayısı:", seoFixes.length);

  // ============================================
  // PHASE 3: SITEDNA GENERATION (Vector Similarity Search)
  // ============================================
  // Generate SiteDNA embedding and store for similarity search
  // Non-blocking: If SiteDNA generation fails, reprocess still succeeds
  try {
    console.log("🧬 [SITE_DNA] SiteDNA generation başlatılıyor...");
    
    // Import dynamically to avoid circular dependency
    const { generateAndStoreSiteDNA } = await import('./site-dna-manager');
    
    // Extract keywords from ranked_keywords data
    let topKeywords: string[] = [];
    let keywordsData: any = null;
    
    if (rankedKeywords?.tasks?.[0]?.result?.[0]?.items) {
      const items = rankedKeywords.tasks[0].result[0].items;
      topKeywords = items
        .slice(0, 100) // Top 100 keywords
        .map((item: any) => item.keyword || item.se_keyword || String(item))
        .filter((kw: string) => typeof kw === 'string');
      keywordsData = items; // Full keyword data
    }

    // Generate AI insights (non-blocking)
    let siteInsights = null;
    try {
      const site = await prisma.site.findUnique({
        where: { id: siteId },
        select: { domain: true },
      });
      
      if (site) {
        const { generateSiteInsights } = await import('./ai-manager');
        siteInsights = await generateSiteInsights(`https://${site.domain}`, {
          techScore: scores.s_tech,
          globalScore: s_global,
          trafficValue: trafficData.estimatedTrafficValue || 0,
          topKeywords: topKeywords,
          ...scores, // Include all 10 scores
        });
      }
    } catch (aiError: any) {
      console.warn("⚠️ [SITE_DNA] AI insights generation skipped:", aiError.message);
      // Continue without AI insights (non-blocking)
    }

    // Generate and store SiteDNA
    const siteDNAResult = await generateAndStoreSiteDNA(siteId, siteInsights, {
      techScore: scores.s_tech,
      globalScore: s_global,
      trafficValue: trafficData.estimatedTrafficValue || 0,
      topKeywords: topKeywords,
      s_sem: scores.s_sem,
      s_link: scores.s_link,
      s_schema: scores.s_schema,
      s_mon: scores.s_mon,
      s_eeat: scores.s_eeat,
      s_fresh: scores.s_fresh,
      s_viral: scores.s_viral,
      s_ux: scores.s_ux,
    });

    if (siteDNAResult.success) {
      console.log("✅ [SITE_DNA] SiteDNA başarıyla oluşturuldu");
    } else {
      console.warn("⚠️ [SITE_DNA] SiteDNA oluşturulamadı:", siteDNAResult.message);
    }
  } catch (dnaError: any) {
    console.error("❌ [SITE_DNA] SiteDNA generation hatası (non-blocking):", dnaError.message);
    // Non-blocking: Reprocess still succeeds even if SiteDNA fails
  }

  return {
    success: true,
    snappostScore: s_global,
    s_tech: scores.s_tech,
    s_sem: scores.s_sem,
    s_link: scores.s_link,
    s_schema: scores.s_schema,
    s_mon: scores.s_mon,
    s_eeat: scores.s_eeat,
    s_fresh: scores.s_fresh,
    s_viral: scores.s_viral,
    s_ux: scores.s_ux,
    s_global: s_global,
    seoFixes: seoFixes,
    trafficData: trafficData,
    message: 'Veri başarıyla yeniden analiz edildi (10 boyutlu skorlama + SiteDNA)',
  };
}

/**
 * Ajansın mevcut kredisini döner
 */
export async function getAgencyCredits(agencyId: string): Promise<number> {
  const agency = await prisma.user.findUnique({
    where: { id: agencyId },
    select: { credits: true },
  });

  if (!agency) {
    throw new Error('Ajans bulunamadı');
  }

  return agency.credits;
}

