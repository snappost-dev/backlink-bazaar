# 🚀 BACKLINK BAZAAR - HYBRID SEO ENGINE v2.0 IMPLEMENTATION PLAN

**Versiyon:** 2.0  
**Tarih:** 2025-01-05  
**Referans:** CURRENT_DATA_ANALYSIS_STRUCTURE.md  
**Durum:** Plan Mode (Implementation Bekliyor)

---

## 📋 İÇİNDEKİLER

1. [Genel Bakış](#genel-bakış)
2. [Phase 1: Veritabanı Güncellemesi](#phase-1-veritabanı-güncellemesi)
3. [Phase 2: Type Definitions](#phase-2-type-definitions)
4. [Phase 3: Cloudflare Worker Entegrasyonu](#phase-3-cloudflare-worker-entegrasyonu)
5. [Phase 4: Veri Akışı Güncellemesi](#phase-4-veri-akışı-güncellemesi)
6. [Phase 5: Skorlama Motoru Yeniden Yazımı](#phase-5-skorlama-motoru-yeniden-yazımı)
7. [Phase 6: Frontend Entegrasyonu](#phase-6-frontend-entegrasyonu)
8. [Phase 7: Environment Configuration](#phase-7-environment-configuration)
9. [Implementation Order](#implementation-order)
10. [Breaking Changes & Backward Compatibility](#breaking-changes--backward-compatibility)

---

## 🎯 GENEL BAKIŞ

### Amaç

Mevcut "Raw-Analysis-Push" mimarisine **Cloudflare Worker (Local Audit)** entegrasyonu ve **10 Boyutlu Skorlama Sistemi** eklenmesi.

### Temel Değişiklikler

1. **Phase 0: Local Audit** - Cloudflare Worker ile yerel SEO kontrolü (0 kredi)
2. **Phase 1: External API** - DataForSEO API çağrıları (1 kredi) - Mevcut sistem
3. **10 Boyutlu Skorlama** - Tek skor yerine 10 alt skor + global skor
4. **SEO Fix Listesi** - Önceliklendirilmiş yapılacaklar listesi

### Veri Akışı (Yeni)

```
User Action → analyzeSite()
  │
  ├─ Phase 0: Local Audit (CF Worker) - 0 Kredi
  │   └─ rawSeoData[locationCode]['local_audit'] ← kaydet
  │
  └─ Phase 1: DataForSEO APIs - 1 Kredi
      └─ rawSeoData[locationCode][apiName] ← kaydet

User Action → reprocessSeoData()
  │
  ├─ Local Audit verisini oku
  ├─ DFS verilerini oku
  ├─ 10 skor hesapla (her biri farklı kaynaklardan)
  ├─ seoFixes listesi oluştur
  └─ DB'ye kaydet (10 skor + seoFixes)
```

---

## 📦 PHASE 1: VERİTABANI GÜNCELLEMESİ

### 1.1 Prisma Schema Güncellemesi

**Dosya**: `prisma/schema.prisma`

**Model**: `Site`

**Değişiklikler**:

```prisma
model Site {
  // ... Mevcut alanlar ...
  
  // RAW DATA (Genişletilmiş)
  // rawSeoData artık 'local_audit' key'ini de içerecek.
  
  // PUSH DATA (Genişletilmiş - Hızlı Okuma İçin)
  snappostScore Int?      @default(0) // Global Skor (default değer eklendi)
  
  // 10 Boyutlu Alt Skorlar (YENİ)
  s_tech        Int?      // Technical Score (CF Worker)
  s_sem         Int?      // Semantic Score (DFS + CF)
  s_link        Int?      // Link Equity (DFS)
  s_schema      Int?      // Schema Health (CF)
  s_mon         Int?      // Monetization (DFS)
  s_eeat        Int?      // Trust Rank (DFS)
  s_fresh       Int?      // Freshness (CF + DFS)
  s_viral       Int?      // Viral Potential (CF)
  s_ux          Int?      // UX Flow (CF Browser Rendering)
  s_global      Int?      // Hesaplanan Ağırlıklı Skor
  
  // Aksiyon Önerileri (YENİ)
  seoFixes      Json?     // Format: [{ code: 'NO_H1', priority: 'HIGH', message: '...' }]
}
```

**Migration Komutu**: 
```bash
npx prisma migrate dev --name add_hybrid_seo_scores
```

**Notlar**:
- Tüm yeni alanlar `Int?` (nullable) - mevcut veriler için null olabilir
- `snappostScore` default değeri 0 yapıldı (önceden null'dı)
- `seoFixes` JSON formatında - esnek yapı

---

## 📝 PHASE 2: TYPE DEFINITIONS

### 2.1 Create Type Definitions File

**Dosya**: `src/lib/types/seo.ts` (yeni dosya)

**İçerik**:

```typescript
// Cloudflare Worker Local Audit Response
export interface LocalAuditResponse {
  // Meta Tags (18 madde)
  meta?: {
    title?: string;
    description?: string;
    h1?: string;
    h2?: string[];
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: string;
    twitterImage?: string;
  };
  
  // Links
  links?: {
    internal?: number;
    external?: number;
    broken?: number;
  };
  
  // Schema
  schema?: {
    jsonLd?: boolean;
    jsonLdErrors?: string[];
    schemaTypes?: string[];
  };
  
  // Performance
  performance?: {
    ttfb?: number;        // Time to First Byte
    lcp?: number;         // Largest Contentful Paint
    contentSize?: number;
    lastModified?: string; // ISO 8601 format
  };
  
  // Technical
  technical?: {
    ssl?: boolean;
    robots?: string;
    sitemap?: boolean;
    hreflang?: boolean;
  };
  
  // E-EAT Signals
  eeat?: {
    authorPage?: boolean;
    aboutPage?: boolean;
    contactPage?: boolean;
  };
  
  // Metadata
  _metadata?: {
    url: string;
    fetchedAt: string;
    workerVersion?: string;
  };
}

// SEO Fix Definition
export interface SeoFix {
  code: string;           // 'NO_H1', 'MISSING_CANONICAL', 'SSL_MISSING', etc.
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;        // Kullanıcı dostu mesaj
  scoreImpact?: number;   // Bu hatanın skora etkisi (0-100)
  category: 'TECHNICAL' | 'SEMANTIC' | 'SCHEMA' | 'PERFORMANCE' | 'OTHER';
}

// Scoring Metrics (10 Boyutlu)
export interface ScoringMetrics {
  s_tech: number | null;    // 0-100
  s_sem: number | null;     // 0-100
  s_link: number | null;    // 0-100
  s_schema: number | null;  // 0-100
  s_mon: number | null;     // 0-100
  s_eeat: number | null;    // 0-100
  s_fresh: number | null;   // 0-100
  s_viral: number | null;   // 0-100
  s_ux: number | null;      // 0-100
  s_global: number | null;  // 0-100 (ağırlıklı ortalama)
}

// RawSeoDataMultiRegion (Genişletilmiş)
export interface RawSeoDataMultiRegion {
  [locationCode: string]: {
    [apiName: string]: {
      data: any;
      timestamp?: string;
    };
  };
}

// 'local_audit' artık rawSeoData[locationCode]['local_audit'] olarak saklanacak
```

---

## ⚙️ PHASE 3: CLOUDFLARE WORKER ENTEGRASYONU

### 3.1 Create CF Worker Client

**Dosya**: `src/lib/api/cloudflare-worker.ts` (yeni dosya)

**Fonksiyon**: `fetchLocalAudit(url: string): Promise<LocalAuditResponse | null>`

**Implementation**:

```typescript
import 'server-only';
import axios from 'axios';
import type { LocalAuditResponse } from '@/lib/types/seo';

const CF_WORKER_URL = process.env.CF_WORKER_URL || 'https://seo-worker.snappost.com';
const CF_WORKER_API_KEY = process.env.CF_WORKER_API_KEY; // Optional

export async function fetchLocalAudit(url: string): Promise<LocalAuditResponse | null> {
  console.log(`--- LOCAL AUDIT: ${url} ---`);
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (CF_WORKER_API_KEY) {
      headers['Authorization'] = `Bearer ${CF_WORKER_API_KEY}`;
    }
    
    const response = await axios.post(
      `${CF_WORKER_URL}/audit`,
      { url },
      {
        headers,
        timeout: 30000, // 30 saniye timeout
      }
    );
    
    if (!response.data) {
      console.error("Local Audit Sonuç Dönmedi:", response.data);
      return null;
    }
    
    // Metadata ekle
    return {
      ...response.data,
      _metadata: {
        url: url,
        fetchedAt: new Date().toISOString(),
        workerVersion: response.data._metadata?.workerVersion,
      },
    };
  } catch (error: any) {
    console.error('CF Worker API Error:', error.response?.data || error.message);
    return null;
  }
}
```

### 3.2 Update seo-manager.ts - Add fetchAndStoreLocalAudit

**Dosya**: `src/lib/services/seo-manager.ts`

**Yeni Fonksiyon**: `fetchAndStoreLocalAudit(siteId: string, url: string, locationCode: number)`

**Lokasyon**: Mevcut `appendApiDataToRawSeoData` fonksiyonundan sonra (satır 321'den sonra)

**Implementation**:

```typescript
import { fetchLocalAudit } from '@/lib/api/cloudflare-worker';

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
```

**Kayıt Formatı**:

```json
{
  "2840": {
    "local_audit": {
      "data": {
        "meta": { ... },
        "links": { ... },
        "schema": { ... },
        "performance": { ... },
        "_metadata": { ... }
      },
      "timestamp": "2025-01-05T10:00:00Z"
    },
    "historical_rank_overview": { ... }
  }
}
```

---

## 🔄 PHASE 4: VERİ AKIŞI GÜNCELLEMESİ

### 4.1 Update analyzeSite Function

**Dosya**: `src/lib/services/seo-manager.ts` (satır 101-259)

**Değişiklikler**:

```typescript
export async function analyzeSite(
  siteId: string,
  agencyId: string,
  locationCode: number
): Promise<AnalyzeSiteResult> {
  // ... Mevcut kredi kontrolü (değişmez) ...
  
  // ... Mevcut domain validasyonu (değişmez) ...
  
  // ============================================
  // PHASE 0: LOCAL AUDIT (CF Worker) - 0 KREDİ
  // ============================================
  console.log(`🔍 [PHASE 0] Local Audit başlatılıyor - Site: ${site.domain}, Location: ${locationCode}`);
  
  const siteUrl = `https://${site.domain}`;
  let localAuditResult;
  
  try {
    localAuditResult = await fetchAndStoreLocalAudit(siteId, siteUrl, locationCode);
    
    if (localAuditResult.success && localAuditResult.localAuditData) {
      // Local Audit başarılı - veriyi geçici olarak sakla
      // (Phase 1 sonunda transaction ile kaydedilecek)
      console.log("✅ [PHASE 0] Local Audit başarılı");
      
      // Opsiyonel: Kritik eşik kontrolü
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
    // ... Mevcut kod (değişmez) ...
  } catch (error: any) {
    // ... Mevcut error handling (değişmez) ...
  }
  
  // ============================================
  // DATA MERGE: Local Audit + DataForSEO
  // ============================================
  // Local Audit verisi varsa, onu da rawSeoData'ya ekle
  let updatedRawSeoData: any = existingSite?.rawSeoData || {};
  
  // ... Mevcut Multi-Region Storage mantığı ...
  
  // Eğer Local Audit başarılıysa, onu da ekle
  if (localAuditResult?.success && localAuditResult.updatedRawSeoData) {
    // Local Audit verisini merge et
    const localAuditLocationData = localAuditResult.updatedRawSeoData[String(locationCode)];
    if (localAuditLocationData?.local_audit) {
      if (!updatedRawSeoData[String(locationCode)]) {
        updatedRawSeoData[String(locationCode)] = {};
      }
      updatedRawSeoData[String(locationCode)]['local_audit'] = localAuditLocationData.local_audit;
    }
  }
  
  // DataForSEO verisini ekle (mevcut mantık)
  updatedRawSeoData[locationKey][apiName] = {
    data: rawSeoData,
    timestamp: rawSeoData._metadata?.fetchedAt || new Date().toISOString(),
  };
  
  // ============================================
  // TRANSACTION: Kayıt (MEVCUT - Değişmez)
  // ============================================
  // ... Mevcut transaction kodu (değişmez) ...
  // updatedRawSeoData artık hem local_audit hem de historical_rank_overview içeriyor
}
```

**Akış Diyagramı**:

```
analyzeSite()
  │
  ├─ Kredi Kontrolü (1 kredi - Phase 1 için)
  ├─ Domain Validasyonu
  │
  ├─ PHASE 0: fetchAndStoreLocalAudit() - 0 Kredi
  │   ├─ CF Worker'a istek at
  │   └─ local_audit verisini hazırla
  │
  ├─ PHASE 1: fetchSeoData() - 1 Kredi
  │   ├─ DataForSEO API çağrısı
  │   └─ historical_rank_overview verisini hazırla
  │
  ├─ DATA MERGE: Local Audit + DFS verilerini birleştir
  │
  └─ TRANSACTION: rawSeoData güncelle + Kredi düş + Log
```

---

## 🎯 PHASE 5: SKORLAMA MOTORU YENİDEN YAZIMI

### 5.1 10 Skor Fonksiyonları

**Dosya**: `src/lib/services/seo-manager.ts`

**Lokasyon**: Mevcut `calculateSnappostScore` fonksiyonundan önce (satır 35'ten önce)

**Yeni Fonksiyonlar**:

#### 5.1.1 Technical Score (S_tech)

```typescript
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
  if (localAudit.technical?.robots === false) {
    score -= 5;
  }
  
  return Math.max(0, Math.min(100, score));
}
```

#### 5.1.2 Semantic Score (S_sem)

```typescript
function calculateSemanticScore(
  localAudit: LocalAuditResponse,
  rankedKeywords: any
): number {
  let score = 0;
  
  // Local Audit: Anahtar kelime yoğunluğu (H1, H2, Title, Description)
  const localScore = 0; // TODO: Kelime yoğunluğu analizi
  
  // DFS: Sıralama başarısı (ranked_keywords)
  const dfsScore = 0;
  
  if (rankedKeywords?.tasks?.[0]?.result?.[0]?.items) {
    const items = rankedKeywords.tasks[0].result[0].items;
    // İlk 10'da kaç kelime var?
    const top10Count = items.filter((item: any) => item.rank_group <= 10).length;
    const totalCount = items.length;
    
    if (totalCount > 0) {
      dfsScore = (top10Count / totalCount) * 100;
    }
  }
  
  // Kombine skor: 40% Local + 60% DFS
  score = (localScore * 0.4) + (dfsScore * 0.6);
  
  return Math.round(Math.max(0, Math.min(100, score)));
}
```

#### 5.1.3 Link Score (S_link)

```typescript
function calculateLinkScore(backlinkSummary: any): number {
  if (!backlinkSummary?.tasks?.[0]?.result?.[0]) {
    return 0;
  }
  
  const result = backlinkSummary.tasks[0].result[0];
  const backlinks = result.backlinks || 0;
  const domains = result.domains || 0;
  
  // Domain Authority normalize etme (0-100)
  // Örnek: 1000+ backlink = 100 puan, 0 backlink = 0 puan
  let score = 0;
  
  if (backlinks > 0 && domains > 0) {
    // Logaritmik normalizasyon
    const avgBacklinks = backlinks / domains;
    score = Math.log10(avgBacklinks + 1) * 20; // 0-100 arası
  }
  
  return Math.round(Math.max(0, Math.min(100, score)));
}
```

#### 5.1.4 Schema Score (S_schema)

```typescript
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
  if (localAudit.schema.schemaTypes?.length) {
    score = Math.min(100, score + (localAudit.schema.schemaTypes.length * 5));
  }
  
  return Math.round(Math.max(0, Math.min(100, score)));
}
```

#### 5.1.5 Monetization Score (S_mon)

```typescript
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
```

#### 5.1.6 E-EAT Score (S_eeat)

```typescript
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
    // Ortak kelime sayısına göre puan
    const avgCommonKeywords = items.reduce((sum: number, item: any) => {
      return sum + (item.common_keywords || 0);
    }, 0) / items.length;
    
    score += Math.min(25, avgCommonKeywords / 10); // Max 25 puan
  }
  
  return Math.round(Math.max(0, Math.min(100, score)));
}
```

#### 5.1.7 Freshness Score (S_fresh)

```typescript
function calculateFreshnessScore(
  localAudit: LocalAuditResponse,
  historicalData: any
): number {
  let score = 100;
  
  // Local Audit: last-modified header
  if (localAudit.performance?.lastModified) {
    const lastModified = new Date(localAudit.performance.lastModified);
    const daysSince = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
    
    // 30 günden eskiyse puan kır
    if (daysSince > 30) {
      score -= Math.min(50, (daysSince - 30) * 2); // Her gün -2 puan, max -50
    }
  }
  
  // DFS: Historical data'dan trend analizi
  if (historicalData?.items?.length) {
    // Son 3 ay verisi varsa bonus
    // TODO: Trend analizi
  }
  
  return Math.round(Math.max(0, Math.min(100, score)));
}
```

#### 5.1.8 Viral Score (S_viral)

```typescript
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
```

#### 5.1.9 UX Score (S_ux)

```typescript
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
```

#### 5.1.10 Global Score (S_global)

```typescript
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
```

### 5.2 Generate SEO Fixes List

**Fonksiyon**: `generateSeoFixes(localAudit: LocalAuditResponse): SeoFix[]`

```typescript
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
      priority: 'CRITICAL',
      message: 'SSL sertifikası bulunamadı. Güvenlik için SSL ekleyin.',
      scoreImpact: 20,
      category: 'TECHNICAL',
    });
  }
  
  // JSON-LD hatası varsa
  if (localAudit.schema?.jsonLdErrors?.length) {
    fixes.push({
      code: 'SCHEMA_ERRORS',
      priority: 'MEDIUM',
      message: `JSON-LD şemada ${localAudit.schema.jsonLdErrors.length} hata bulundu.`,
      scoreImpact: localAudit.schema.jsonLdErrors.length * 5,
      category: 'SCHEMA',
    });
  }
  
  // ... Diğer kontroller ...
  
  // Önceliğe göre sırala
  const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
  fixes.sort((a, b) => {
    return (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999);
  });
  
  return fixes;
}
```

### 5.3 Update reprocessSeoData

**Dosya**: `src/lib/services/seo-manager.ts` (satır 734-835)

**Değişiklikler**:

```typescript
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
  
  if (!site || !site.rawSeoData) {
    throw new Error('Site veya ham SEO verisi bulunamadı');
  }
  
  // 2. Multi-Region Storage'dan veriyi çek
  const rawData = site.rawSeoData as any;
  
  // Location belirleme (mevcut mantık)
  let locationKey: string;
  if (locationCode) {
    locationKey = String(locationCode);
  } else {
    const locationKeys = Object.keys(rawData).filter(key => key !== 'tasks');
    if (locationKeys.length === 0) {
      throw new Error('Ham veri formatı geçersiz veya location verisi yok');
    }
    locationKey = locationKeys[0];
  }
  
  const locationData = rawData[locationKey];
  if (!locationData) {
    throw new Error(`Location ${locationKey} için veri bulunamadı`);
  }
  
  // 3. Local Audit verisini al
  const localAudit = locationData.local_audit?.data as LocalAuditResponse | undefined;
  
  // 4. DFS verilerini al
  const historicalData = locationData.historical_rank_overview?.data;
  const rankedKeywords = locationData.ranked_keywords?.data;
  const backlinkSummary = rawData.global?.backlink_summary?.data || rawData['0']?.backlink_summary?.data;
  const domainIntersection = locationData.domain_intersection?.data;
  
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
  
  // 6. Global Skor Hesaplama
  const s_global = calculateGlobalScore(scores);
  
  // 7. SEO Fixes Listesi Oluştur
  const seoFixes = localAudit ? generateSeoFixes(localAudit) : [];
  
  // 8. Traffic Data (Mevcut mantık - değişmez)
  const historicalResult = historicalData?.tasks?.[0]?.result?.[0];
  const latestItem = historicalResult?.items?.[0];
  const metrics = latestItem?.metrics?.organic || {};
  
  const trafficData = {
    estimatedTrafficValue: metrics.etv || 0,
    history: historicalResult?.items?.map((item: any) => ({
      date: `${item.year}-${item.month}`,
      value: item.metrics?.organic?.etv || 0,
    })) || [],
  };
  
  // 9. Veritabanına Kaydet
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
      seoFixes: seoFixes as any, // JSON olarak kaydet
      trafficData: trafficData,
    },
  });
  
  console.log("✅ [REPROCESS] İşlenmiş veriler kaydedildi");
  console.log("📊 [REPROCESS] Skorlar:", scores);
  console.log("🔧 [REPROCESS] Fix sayısı:", seoFixes.length);
  
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
    message: 'Veri başarıyla yeniden analiz edildi',
  };
}
```

### 5.4 Deprecate Old calculateSnappostScore

**Dosya**: `src/lib/services/seo-manager.ts` (satır 35-77)

**Action**: Eski fonksiyonu kaldır veya `@deprecated` olarak işaretle:

```typescript
/**
 * @deprecated Bu fonksiyon v2.0'da kaldırıldı. 10 boyutlu skorlama sistemi kullanın.
 * Yeni sistem: calculateTechnicalScore, calculateSemanticScore, etc. + calculateGlobalScore
 */
function calculateSnappostScore(metrics: {...}): number {
  // Eski kod - sadece backward compatibility için
  // Yeni sistemde kullanılmayacak
}
```

---

## 🎨 PHASE 6: FRONTEND ENTEGRASYONU

### 6.1 Create Health Check Panel Component

**Dosya**: `src/components/agency/HealthCheckPanel.tsx` (yeni dosya)

**Features**:
- Radar Chart (10 skorun görsel dağılımı)
- Fix Listesi (önceliklendirilmiş)
- Skor Kartları (renk kodlu)

**Dependencies**: `recharts` (zaten mevcut - package.json'da)

**Implementation Özeti**:

```typescript
interface HealthCheckPanelProps {
  scores: {
    s_tech: number | null;
    s_sem: number | null;
    // ... diğer 8 skor
    s_global: number | null;
  };
  seoFixes: SeoFix[];
}

export function HealthCheckPanel({ scores, seoFixes }: HealthCheckPanelProps) {
  // Radar Chart data
  const radarData = [
    { name: 'Technical', value: scores.s_tech || 0 },
    { name: 'Semantic', value: scores.s_sem || 0 },
    { name: 'Link', value: scores.s_link || 0 },
    { name: 'Schema', value: scores.s_schema || 0 },
    { name: 'Monetization', value: scores.s_mon || 0 },
    { name: 'E-EAT', value: scores.s_eeat || 0 },
    { name: 'Freshness', value: scores.s_fresh || 0 },
    { name: 'Viral', value: scores.s_viral || 0 },
    { name: 'UX', value: scores.s_ux || 0 },
  ];
  
  return (
    <div className="space-y-6">
      {/* Radar Chart */}
      <RadarChart ... />
      
      {/* Skor Kartları Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(scores).map(([key, value]) => (
          <ScoreCard key={key} name={key} value={value} />
        ))}
      </div>
      
      {/* Fix Listesi */}
      <FixList fixes={seoFixes} />
    </div>
  );
}
```

### 6.2 Update InventoryDetailClient Props

**Dosya**: `src/app/(dashboard)/agency/inventory/[id]/InventoryDetailClient.tsx`

**Değişiklikler**:

```typescript
interface InventoryDetailClientProps {
  site: Site;
  agencyId: string;
  snappostScore: number | null;
  detailedMetrics: DetailedMetrics | null;
  rawSeoData: RawSeoDataMultiRegion | null;
  
  // YENİ PROPS
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
  seoFixes?: SeoFix[];
}
```

### 6.3 Update InventoryDetailClient Component

**Dosya**: `src/app/(dashboard)/agency/inventory/[id]/InventoryDetailClient.tsx`

**Değişiklikler**:
- HealthCheckPanel import et
- HealthCheckPanel component'ini render et (mevcut "Analiz Sonuçları" bölümünden önce)
- Local Audit parse helper fonksiyonu ekle

**Lokasyon**: Mevcut helper fonksiyonlardan sonra (satır ~413'ten sonra)

```typescript
const parseLocalAudit = (locationCode: number | null) => {
  const apiData = getApiData(locationCode, 'local_audit');
  if (!apiData?.data) return null;
  return apiData.data as LocalAuditResponse;
};
```

### 6.4 Update Page Component

**Dosya**: `src/app/(dashboard)/agency/inventory/[id]/page.tsx`

**Değişiklikler**:
- Site query'sine yeni skor alanlarını ekle
- seoFixes'i parse et
- InventoryDetailClient'a yeni props'ları geç

**Query Güncellemesi**:

```typescript
const site = await prisma.site.findUnique({
  where: { id: siteId },
  select: {
    // ... mevcut alanlar ...
    s_tech: true,
    s_sem: true,
    s_link: true,
    s_schema: true,
    s_mon: true,
    s_eeat: true,
    s_fresh: true,
    s_viral: true,
    s_ux: true,
    s_global: true,
    seoFixes: true,
  },
});

// seoFixes parse
const seoFixes = (site.seoFixes as SeoFix[]) || [];

// Scores object
const scores = {
  s_tech: site.s_tech,
  s_sem: site.s_sem,
  s_link: site.s_link,
  s_schema: site.s_schema,
  s_mon: site.s_mon,
  s_eeat: site.s_eeat,
  s_fresh: site.s_fresh,
  s_viral: site.s_viral,
  s_ux: site.s_ux,
  s_global: site.s_global,
};

// InventoryDetailClient'a geç
<InventoryDetailClient
  // ... mevcut props ...
  scores={scores}
  seoFixes={seoFixes}
/>
```

---

## 🔧 PHASE 7: ENVIRONMENT CONFIGURATION

### 7.1 Environment Variables

**Dosya**: `.env.local` (veya `.env`)

**Yeni Değişkenler**:

```env
# Cloudflare Worker Configuration
CF_WORKER_URL=https://seo-worker.snappost.com
CF_WORKER_API_KEY=optional_if_needed

# Local Audit Threshold (Opsiyonel)
LOCAL_AUDIT_THRESHOLD=30  # Kritik eşik değeri (Phase 0'da kontrol için)
```

**Not**: `CF_WORKER_API_KEY` opsiyonel - Worker authentication gerektiriyorsa eklenir.

---

## ✅ IMPLEMENTATION ORDER

### Step 1: Database & Types
1. Prisma schema güncelle (10 skor + seoFixes)
2. Migration çalıştır: `npx prisma migrate dev --name add_hybrid_seo_scores`
3. Type definitions oluştur (`src/lib/types/seo.ts`)

### Step 2: CF Worker Integration
4. CF Worker client oluştur (`src/lib/api/cloudflare-worker.ts`)
5. `fetchAndStoreLocalAudit` fonksiyonunu ekle (`seo-manager.ts`)

### Step 3: Data Flow Update
6. `analyzeSite` fonksiyonuna Phase 0 ekle (Local Audit)
7. Data merge mantığını güncelle (Local Audit + DFS)

### Step 4: Scoring Engine
8. 10 skor fonksiyonunu yaz (calculateTechnicalScore, etc.)
9. `generateSeoFixes` fonksiyonunu yaz
10. `reprocessSeoData` fonksiyonunu yeniden yaz
11. Eski `calculateSnappostScore` fonksiyonunu deprecated olarak işaretle

### Step 5: Frontend
12. HealthCheckPanel component'ini oluştur
13. InventoryDetailClient props'larını güncelle
14. Page component'ini güncelle (query + props)

### Step 6: Configuration
15. Environment variables ekle
16. Test & validation

---

## ⚠️ BREAKING CHANGES & BACKWARD COMPATIBILITY

### Breaking Changes

1. **`calculateSnappostScore()` Fonksiyonu**: 
   - Kaldırılıyor (deprecated)
   - Yeni sistem: 10 ayrı skor fonksiyonu + `calculateGlobalScore()`

2. **`reprocessSeoData()` Return Type**:
   - Eski: `{ success, snappostScore, trafficData, message }`
   - Yeni: `{ success, snappostScore, s_tech, s_sem, ..., s_global, seoFixes, trafficData, message }`

3. **Frontend Props**:
   - `InventoryDetailClientProps`'a `scores` ve `seoFixes` eklendi
   - Mevcut props'lar korunuyor (backward compatible)

### Backward Compatibility

1. **rawSeoData Formatı**:
   - Mevcut format korunur (`local_audit` eklenir)
   - Eski veriler çalışmaya devam eder

2. **Skorlar**:
   - Yeni skorlar `null` olabilir (migration sonrası)
   - Eski `snappostScore` korunur (global skor olarak güncellenecek)

3. **Local Audit**:
   - Başarısız olsa bile sistem çalışmaya devam eder (non-blocking)
   - DFS çağrıları normal devam eder

4. **Kredi Sistemi**:
   - Local Audit: 0 kredi (değişmez)
   - DFS çağrıları: 1 kredi (mevcut mantık)

---

## 📊 TEST SCENARIOS

### Senaryo 1: Happy Path
- Local Audit başarılı
- DFS başarılı
- 10 skor hesaplanıyor
- seoFixes oluşturuluyor

### Senaryo 2: Local Audit Fails
- Local Audit başarısız (CF Worker down)
- DFS başarılı
- 10 skor kısmen hesaplanıyor (Local Audit olmadan çalışan skorlar)
- seoFixes boş

### Senaryo 3: Partial Data
- Local Audit başarılı
- DFS kısmen başarılı (sadece historical_rank_overview)
- Eksik veriler için skorlar 0 veya null
- seoFixes oluşturuluyor

### Senaryo 4: Migration
- Mevcut veriler korunuyor
- Yeni skorlar null (reprocess gerekli)
- Eski snappostScore korunuyor

---

## 📝 NOTES

### Kredi Sistemi
- **Local Audit**: 0 kredi (ücretsiz)
- **DFS Çağrıları**: 1 kredi/çağrı (mevcut mantık)
- Local Audit başarısız olsa bile kredi düşmez

### Skor Ağırlıkları
- Şu an hardcoded (weights objesi içinde)
- Gelecekte configurable yapılabilir (DB'de saklanabilir)

### CF Worker Endpoint
- Default: `https://seo-worker.snappost.com/audit`
- Environment variable ile override edilebilir
- Authentication opsiyonel (API key)

### Local Audit Threshold
- Opsiyonel kontrol mekanizması
- Technical score kritik eşiğin altındaysa uyarı (işlem durdurulmaz)

---

**Son Güncelleme**: 2025-01-05  
**Plan Versiyonu**: 1.0  
**Durum**: Implementation Bekliyor

