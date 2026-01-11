---
name: V2 İki Katmanlı SEO Analiz Görselleştirme
overview: Phase 0 (CF Worker - ücretsiz) ve Phase 1 (DataForSEO - ücretli) verilerini ayrı görselleştiren yeni V2 inventory sayfası oluşturulacak. Üst kısımda Phase 0 hızlı önizleme, alt kısımda Phase 1 detaylı analiz, AI önerileri ve pgvector benzer site analizi gösterilecek.
todos:
  - id: create_v2_route
    content: "Yeni route oluştur: /inventory-v2/[id] (page.tsx ve InventoryV2Client.tsx)'"
    status: completed
  - id: create_phase0_components
    content: Phase 0 görselleştirme componentleri oluştur (Phase0QuickPreview, Phase0HealthCard)
    status: completed
    dependencies:
      - create_v2_route
  - id: create_phase1_components
    content: Phase 1 detaylı analiz componentleri oluştur (Phase1DetailedAnalysis, RawDataCards, AIAnalysisPanel)
    status: pending
    dependencies:
      - create_v2_route
  - id: create_similar_sites_panel
    content: Similar Sites panel oluştur (pgvector similarity search integration)
    status: pending
    dependencies:
      - create_phase1_components
  - id: create_phase1_activation
    content: Phase 1 activation dialog ve flow oluştur (kredi kontrolü ile)
    status: pending
    dependencies:
      - create_v2_route
  - id: enhance_score_visualization
    content: 10-dimensional score radar chart component genişlet (Phase 0 vs Phase 1 source indicators)
    status: pending
    dependencies:
      - create_phase1_components
  - id: add_navigation_link
    content: Mevcut inventory list sayfasına V2 link ekle'
    status: pending
    dependencies:
      - create_v2_route
  - id: add_export_functionality
    content: Data export component oluştur (JSON, CSV, PDF)
    status: pending
    dependencies:
      - create_phase1_components
  - id: test_phase0_display
    content: Phase 0 verilerinin doğru gösterildiğini test et
    status: pending
    dependencies:
      - create_phase0_components
  - id: test_phase1_flow
    content: Phase 1 activation flow ve veri görselleştirmesini test et
    status: pending
    dependencies:
      - create_phase1_activation
      - create_phase1_components
  - id: create_page_level_panel
    content: Page-level analysis panel oluştur (relevant_pages'ten gelen sayfalar için görselleştirme)
    status: pending
    dependencies:
      - create_phase1_components
  - id: create_page_classifier
    content: Page type classifier utility oluştur (Blog/Content/Homepage/Other tespiti)
    status: pending
    dependencies:
      - create_page_level_panel
  - id: create_page_detail_modal
    content: Page detail modal oluştur (opsiyonel page-level CF Worker analizi için)
    status: pending
    dependencies:
      - create_page_level_panel
  - id: create_page_metrics_aggregation
    content: Page metrics aggregation component oluştur (Blog vs Content karşılaştırması)
    status: pending
    dependencies:
      - create_page_classifier
  - id: add_page_analysis_action
    content: analyzePageAction ekle (opsiyonel page-level CF Worker analizi için - ek kredi)
    status: pending
    dependencies:
      - create_page_detail_modal
  - id: test_page_level_display
    content: Page-level analiz görselleştirmesini test et (relevant_pages, filtreleme, detay modal)
    status: pending
    dependencies:
      - create_page_level_panel
      - create_page_classifier
---

#

V2 İki Katmanlı SEO Analiz Görselleştirme Planı

## Overview

Yeni bir V2 inventory sayfası oluşturulacak (`/inventory-v2/[id]`). Bu sayfa iki katmanlı veri görselleştirmesi sunacak:

- **Phase 0 (Üst Kısım)**: CF Worker'dan gelen ücretsiz, adil kullanım kotası olan veriler - Hızlı önizleme

- **Phase 1 (Alt Kısım)**: DataForSEO'dan gelen ücretli, token bağlı, 7 API'den gelen detaylı veriler - AI önerileri ve pgvector analizi ile

Mevcut `/inventory/[id]` sayfası olduğu gibi kalacak.

## Data Flow

```javascript
Kullanıcı Site Ekleme Akışı:
1. Site ekleme formu
2. Phase 0 (CF Worker) - Otomatik çalışır (ücretsiz)
   └─ local_audit verisi toplanır
   └─ İlk sorgu ekranında gösterilir
3. Kullanıcı devam etmek ister mi? (Karar noktası)
   ├─ EVET → Phase 1 başlat (1 kredi/token)
   │   └─ 7 DataForSEO API çağrısı
   │   └─ AI analiz (Gemini)
   │   └─ pgvector SiteDNA oluştur
   │   └─ V2 detaylı ekran göster
   └─ HAYIR → Sadece Phase 0 verileri göster
```

## Implementation Steps

### 1. Yeni Route Yapısı

**Dosya**: `src/app/(dashboard)/agency/inventory-v2/[id]/page.tsx` (new)

**Dosya**: `src/app/(dashboard)/agency/inventory-v2/[id]/InventoryV2Client.tsx` (new)

**Route**: `/inventory-v2/[id]` (mevcut `/inventory/[id]` ile paralel)

**Page Component**:

- Phase 0 verilerini çek (local_audit)

- Phase 1 verilerini çek (rawSeoData içindeki DataForSEO API'leri)

- SiteDNA verilerini çek (benzer siteler için)

- AI Insights'ı çek (aiInsights from SiteDNA)

- Tüm verileri InventoryV2Client'a pass et

### 2. Phase 0 Görselleştirme (Üst Kısım)

**Component**: `Phase0QuickPreview.tsx` (new)

**Gösterilecek Veriler** (CF Worker - local_audit):

- **Technical Health Score** (s_tech from local_audit)

- **H1/H2/H3 Tags** (Semantic structure)

- **Meta Tags** (title, description)

- **Schema Markup** (s_schema score)

- **Performance Metrics** (s_ux score)

- **Quick Fixes** (Local audit'tan gelen kritik sorunlar)

**UI Design**:

- Compact card layout

- Color-coded health indicators (green/yellow/red)

- "Phase 1 Detaylı Analiz Başlat" butonu (kredi kontrolü ile)

- Ücretsiz badge göster

**Veri Kaynağı**:

```typescript
rawSeoData[locationCode]['local_audit'] // CF Worker response
```

### 3. Phase 1 Görselleştirme (Alt Kısım)

**Component**: `Phase1DetailedAnalysis.tsx` (new)

**Gösterilecek Veriler** (DataForSEO - 7 API):

#### 3.1 Raw Data Cards (Ham Veri)

- **Ranked Keywords Table** (ranked_keywords API)

- Keyword, Rank, Volume, CPC, Intent, Difficulty

- Export/Download functionality

- **SERP Competitors List** (serp_competitors API)

- Domain, Relevance Score, Common Keywords

- **Traffic Monster Pages** (relevant_pages API)

- URL, Estimated Traffic, Top Keywords

- **Backlink Summary** (backlink_summary API)

- Trust Score, Total Backlinks, Referring Domains

#### 3.2 AI-Powered Analysis (AI Önerileri)

**Component**: `AIAnalysisPanel.tsx` (new)

**Gemini AI Insights** (SiteDNA.aiInsights):

- **Site Category** badge

- **Executive Summary** (one-liner for investors)

- **Risk Level** indicator (Low/Medium/High)

- **Estimated Market Price** (TL cinsinden)

- **Pros** listesi (AI-generated advantages)

- **Cons** listesi (AI-generated concerns)

- **Investment Recommendation** (AI scorecard)

**Veri Kaynağı**:

```typescript
siteDNA.aiInsights // SiteInsights interface from Gemini
```

#### 3.3 SEO Fix Recommendations

**Component**: `SeoFixesPanel.tsx` (enhance existing)

**Mevcut `seoFixes` JSON'dan**:

- Priority sıralı fix listesi (HIGH → MEDIUM → LOW)

- Her fix için:

- Category badge

- Message

- Score Impact (potential improvement)

- Action button (implement fix)

#### 3.4 Similar Sites Analysis (pgvector)

**Component**: `SimilarSitesPanel.tsx` (new)

**pgvector Similarity Search** (`findSimilarSites` fonksiyonu):

- Top 10 benzer site listesi

- Similarity score gösterimi

- Her benzer site için:

- Domain

- Category

- Similarity percentage

- Top keywords overlap

- Price comparison (if available)

- "View Details" link

**Veri Kaynağı**:

```typescript
findSimilarSites(siteId, 10) // from site-dna-manager.ts
```

### 4. 10-Dimensional Score Visualization

**Component**: `ScoreRadarChart.tsx` (enhance existing HealthCheckPanel)

**Mevcut HealthCheckPanel'ı genişlet**:

- Radar chart (10 skor)

- Her skor için detaylı açıklama tooltip

- Score source indicator (Phase 0 vs Phase 1)

- Trend arrows (önceki skorlarla karşılaştırma)

### 5. Interactive Features

#### 5.1 Phase 1 Activation Flow

**Component**: `Phase1ActivationDialog.tsx` (new)

**Akış**:

1. Kullanıcı "Detaylı Analiz Başlat" butonuna tıklar

2. Modal açılır:

- Kredi/token kontrolü (agency credits)

- Phase 1 analiz maliyeti gösterimi (1 credit)

- "Onayla ve Başlat" butonu

3. `analyzeSite` action çağrılır (Phase 0 + Phase 1)

4. Loading state gösterilir

5. Sonuç geldiğinde Phase 1 bölümü reveal edilir

#### 5.2 Location Selection

**Component**: `LocationSelector.tsx` (enhance existing)

**Mevcut location selector'ı genişlet**:

- Phase 0 ve Phase 1 verilerini ayrı ayrı filtrele

- Multi-location comparison view

- Location-specific score breakdown

#### 5.3 Data Export

**Component**: `DataExportButton.tsx` (new)

**Export Options**:

- JSON export (raw data)

- CSV export (ranked keywords, competitors)

- PDF report (AI insights + scores)

### 6. State Management

**Props Structure**:

```typescript
interface InventoryV2ClientProps {
  site: Site;
  agencyId: string;
  
  // Phase 0 Data (CF Worker)
  phase0Data: {
    localAudit: LocalAuditResponse | null;
    s_tech: number | null;
    s_schema: number | null;
    s_ux: number | null;
    quickFixes: SeoFix[]; // Critical fixes from local audit
  };
  
  // Phase 1 Data (DataForSEO)
  phase1Data: {
    isAvailable: boolean; // Has user activated Phase 1?
    rankedKeywords: any[] | null;
    serpCompetitors: any[] | null;
    relevantPages: any[] | null;
    backlinkSummary: any | null;
    domainIntersection: any | null;
    backlinkHistory: any | null;
    historicalRank: any | null;
  };
  
  // Scores (10-Dimensional)
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
  
  // AI Insights
  aiInsights: SiteInsights | null;
  
  // SiteDNA (for similar sites)
  siteDNA: {
    topKeywords: string[];
    aiInsights: SiteInsights | null;
    hasEmbedding: boolean; // vector exists?
  };
  
  // SEO Fixes
  seoFixes: SeoFix[];
  
  // Similar Sites (pgvector)
  similarSites: Array<{
    site: Site;
    similarity: number;
    dna: any;
  }> | null;
}
```

### 7. Navigation Integration

**Mevcut Inventory List'e V2 Link Ekle**:

- `src/app/(dashboard)/agency/inventory/page.tsx`

- Her site için "V2 Analiz" butonu/link ekle

- V2 badge göster (eğer Phase 1 activated ise)

**Breadcrumb**:

```javascript
Inventory > Site Detail (V1) / V2 Analysis
```

### 8. Conditional Rendering Logic

**Phase 1 Availability Check**:

```typescript
const phase1Available = phase1Data.isAvailable || phase1Data.rankedKeywords !== null;

// Phase 1 bölümünü sadece available ise göster
{phase1Available ? (
  <Phase1DetailedAnalysis {...phase1Data} />
) : (
  <Phase1ActivationPrompt onActivate={handlePhase1Activation} />
)}
```

### 9. Performance Optimizations

- **Lazy Loading**: Phase 1 components sadece activated ise load

- **Data Caching**: React Query veya SWR kullan

- **Progressive Enhancement**: Phase 0 önce yüklenir, Phase 1 lazy load

### 10. UI/UX Enhancements

**Design System**:

- Shadcn/ui components kullan

- Color coding:

- Phase 0: Blue/Indigo (free, quick)

- Phase 1: Purple/Violet (premium, detailed)

- AI Insights: Gold/Amber (value-added)

- Responsive design (mobile-first)

- Loading skeletons

- Error states (graceful degradation)

## Files to Create

1. **Route & Page**:

- `src/app/(dashboard)/agency/inventory-v2/[id]/page.tsx`

- `src/app/(dashboard)/agency/inventory-v2/[id]/InventoryV2Client.tsx`

2. **Phase 0 Components**:

- `src/components/agency/inventory-v2/Phase0QuickPreview.tsx`

- `src/components/agency/inventory-v2/Phase0HealthCard.tsx`

3. **Phase 1 Components**:

- `src/components/agency/inventory-v2/Phase1DetailedAnalysis.tsx`

- `src/components/agency/inventory-v2/RawDataCards.tsx`

- `src/components/agency/inventory-v2/AIAnalysisPanel.tsx`

- `src/components/agency/inventory-v2/SeoFixesPanel.tsx` (enhance)

- `src/components/agency/inventory-v2/SimilarSitesPanel.tsx`

4. **Interactive Components**:

- `src/components/agency/inventory-v2/Phase1ActivationDialog.tsx`

- `src/components/agency/inventory-v2/DataExportButton.tsx`

- `src/components/agency/inventory-v2/LocationSelector.tsx` (enhance)

5. **Charts & Visualizations**:

- `src/components/agency/inventory-v2/ScoreRadarChart.tsx` (enhance)

- `src/components/agency/inventory-v2/SimilarityChart.tsx` (new)

## Files to Modify

1. **Actions**:

- `src/app/actions/seo-actions.ts` - Phase 1 activation action ekle

2. **Services**:

- `src/lib/services/site-dna-manager.ts` - findSimilarSites export (zaten var)

3. **Navigation**:

- `src/app/(dashboard)/agency/inventory/page.tsx` - V2 link ekle

## Testing Checklist

- [ ] Phase 0 verileri doğru gösteriliyor (CF Worker)

- [ ] Phase 1 activation flow çalışıyor (kredi kontrolü)

- [ ] 7 DataForSEO API verileri doğru parse ediliyor

- [ ] AI Insights (Gemini) doğru gösteriliyor

- [ ] SEO Fixes priority sıralaması doğru

- [ ] Similar Sites (pgvector) çalışıyor

- [ ] Location selector Phase 0 ve Phase 1'i ayrı filtreliyor

- [ ] Export fonksiyonları çalışıyor (JSON, CSV, PDF)

- [ ] Responsive design mobile'da çalışıyor

- [ ] Loading states ve error handling çalışıyor

## Success Criteria

- [ ] V2 route aktif ve çalışıyor (`/inventory-v2/[id]`)

- [ ] Phase 0 üst kısımda, Phase 1 alt kısımda gösteriliyor

- [ ] Phase 1 activation kredi kontrolü ile çalışıyor

- [ ] AI Insights (Gemini) görselleştiriliyor

- [ ] Similar Sites (pgvector) gösteriliyor

- [ ] Mevcut V1 sayfası çalışmaya devam ediyor

### 11. Sayfa Bazlı Analiz (Page-Level Analysis)

**Önemli Eksiklik**: Şu anda sadece ana sayfa (`https://domain.com`) analiz ediliyor. Bir web sitesinin birden çok sayfası var (özellikle blog ve içerik sayfaları) ve bunların analize dahil edilmesi gerekiyor.

#### 11.1 Phase 0: Ana Sayfa Analizi (Mevcut - Korunacak)

**Durum**: CF Worker sadece ana sayfayı analiz ediyor (kota korunması için)

**Strateji**: Phase 0'da sadece homepage analizi kalacak, page-level analiz Phase 1'de yapılacak (ücretli)

#### 11.2 Phase 1: Sayfa Bazlı Analiz (Yeni Özellik)

**Component**: `PageLevelAnalysisPanel.tsx` (new)

**Veri Kaynağı**: `relevant_pages` API'sinden gelen sayfalar

**Gösterilecek Veriler**:

- **Traffic Monster Pages List** (relevant_pages API'den)
  - URL, Estimated Traffic, Rank Group, Paid Traffic Cost
  - Blog/Content sayfası tespiti (URL pattern: `/blog/`, `/post/`, `/content/`, `/article/`)
  - Sayfa kategorisi (Homepage, Blog, Content, Product, Other)

- **Page-Level Quick Preview Cards**
  - Her sayfa için kompakt kart
  - URL, Trafik miktarı, Sayfa tipi (Blog/Content/Other)
  - "Detaylı Analiz" butonu (opsiyonel - ek kredi ile CF Worker analizi)

- **Blog/Content Sayfaları Filtreleme**
  - URL pattern bazlı tespit
  - Blog sayfaları için ayrı görünüm
  - Content sayfaları için ayrı görünüm

**UI Design**:

- Tab/Filter sistemi:
  - Tüm Sayfalar
  - Blog Sayfaları
  - Content Sayfaları
  - Homepage (Phase 0 verisi)

- Her sayfa için card layout:
  - URL preview (truncated)
  - Traffic badge
  - Page type badge (Blog/Content/Homepage)
  - "Detaylı Analiz" butonu (ek kredi - opsiyonel)

#### 11.3 Page-Level Detaylı Analiz (Opsiyonel - Ek Kredi)

**Component**: `PageDetailModal.tsx` (new)

**Akış**:

1. Kullanıcı bir sayfanın "Detaylı Analiz" butonuna tıklar
2. Modal açılır:

   - Kredi maliyeti gösterimi (1 kredi per page)
   - "Onayla ve Analiz Et" butonu

3. CF Worker'a o sayfa için istek atılır (`fetchLocalAudit(pageUrl)`)
4. Page-level SEO skorları hesaplanır
5. Modal içinde detaylı sonuçlar gösterilir:

   - Page-level Technical Score
   - Meta Tags (title, description, H1, H2)
   - Schema Markup
   - Performance Metrics
   - Page-specific SEO Fixes

**Veri Saklama**:

```typescript
rawSeoData[locationCode]['page_audits'] = {
  [pageUrl]: {
    localAudit: LocalAuditResponse,
    pageScore: number,
    pageFixes: SeoFix[],
    analyzedAt: string,
  }
}
```

#### 11.4 Blog/Content Sayfası Tespiti

**Component**: `PageTypeClassifier.tsx` (new utility)

**Mantık**:

```typescript
function classifyPageType(url: string): 'HOMEPAGE' | 'BLOG' | 'CONTENT' | 'PRODUCT' | 'OTHER' {
  // Homepage
  if (url === 'https://domain.com' || url === 'https://domain.com/') {
    return 'HOMEPAGE';
  }
  
  // Blog patterns
  const blogPatterns = ['/blog/', '/post/', '/article/', '/news/', '/updates/'];
  if (blogPatterns.some(pattern => url.includes(pattern))) {
    return 'BLOG';
  }
  
  // Content patterns
  const contentPatterns = ['/content/', '/guide/', '/how-to/', '/tutorial/', '/resources/'];
  if (contentPatterns.some(pattern => url.includes(pattern))) {
    return 'CONTENT';
  }
  
  // Product patterns
  const productPatterns = ['/product/', '/shop/', '/item/', '/buy/'];
  if (productPatterns.some(pattern => url.includes(pattern))) {
    return 'PRODUCT';
  }
  
  return 'OTHER';
}
```

#### 11.5 Aggregate Page-Level Metrics

**Component**: `PageMetricsAggregation.tsx` (new)

**Hesaplanacak Metrikler**:

- **Top Blog Pages**: Blog sayfaları arasından en çok trafik alanlar
- **Top Content Pages**: Content sayfaları arasından en çok trafik alanlar
- **Average Page Score**: Tüm analiz edilen sayfaların ortalama SEO skoru
- **Blog vs Content Comparison**: Blog ve content sayfalarının karşılaştırması
- **Page Distribution Chart**: Sayfa tiplerinin dağılımı (pie/bar chart)

#### 11.6 Integration with Phase 1

**Data Flow**:

```
Phase 1 Activation (relevant_pages API)
  │
  └─ relevant_pages API'den sayfalar alınır
      │
      ├─ Sayfa tipi tespiti (Blog/Content/Other)
      ├─ URL pattern analizi
      ├─ Traffic sıralaması
      │
      └─ PageLevelAnalysisPanel'de gösterilir
          │
          ├─ Tüm sayfalar listesi
          ├─ Blog sayfaları filtresi
          ├─ Content sayfaları filtresi
          │
          └─ Her sayfa için "Detaylı Analiz" butonu (opsiyonel)
              │
              └─ CF Worker'a istek (1 kredi per page)
                  │
                  └─ Page-level SEO skorları + fixes
```

### 12. Files to Create (Sayfa Bazlı Analiz için)

1. **Components**:

   - `src/components/agency/inventory-v2/PageLevelAnalysisPanel.tsx` (new)
   - `src/components/agency/inventory-v2/PageDetailModal.tsx` (new)
   - `src/components/agency/inventory-v2/PageMetricsAggregation.tsx` (new)
   - `src/components/agency/inventory-v2/PageTypeClassifier.tsx` (new utility)

2. **Services**:

   - `src/lib/utils/page-classifier.ts` (new utility function)

3. **Actions**:

   - `src/app/actions/seo-actions.ts` - `analyzePageAction` ekle (opsiyonel page-level CF Worker analizi için)

### 13. Updated Testing Checklist

Sayfa bazlı analiz için eklenenler:

- [ ] relevant_pages API'den sayfalar doğru parse ediliyor
- [ ] Sayfa tipi tespiti doğru çalışıyor (Blog/Content/Homepage/Other)
- [ ] Page-level analiz filtresi çalışıyor (Tüm/Blog/Content)
- [ ] Page detail modal açılıyor ve veri gösteriyor
- [ ] Opsiyonel page-level CF Worker analizi çalışıyor (ek kredi ile)
- [ ] Page-level SEO skorları doğru hesaplanıyor
- [ ] Page metrics aggregation doğru hesaplanıyor
- [ ] Blog vs Content karşılaştırması çalışıyor

### 14. Updated Success Criteria

- [ ] relevant_pages'ten gelen sayfalar gösteriliyor
- [ ] Sayfa tipi tespiti çalışıyor (Blog/Content/Other)
- [ ] Blog ve Content sayfaları ayrı filtrelenebiliyor
- [ ] Opsiyonel page-level detaylı analiz çalışıyor (ek kredi ile)
- [ ] Page-level metrikler hesaplanıyor ve görselleştiriliyor