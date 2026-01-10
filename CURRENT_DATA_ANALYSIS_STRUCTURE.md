# 📊 BACKLINK BAZAAR - MEVCUT VERİ ANALİZİ YAPISI

**Versiyon:** 1.0  
**Tarih:** 2025-01-05  
**Durum:** Mevcut Yapı Dokümantasyonu

---

## 📋 İÇİNDEKİLER

1. [Genel Bakış](#genel-bakış)
2. [Mimari: Raw-Analysis-Push](#mimari-raw-analysis-push)
3. [Veri Yapısı: Multi-Region Storage](#veri-yapısı-multi-region-storage)
4. [Veri Akışı Diyagramı](#veri-akışı-diyagramı)
5. [Analiz Fonksiyonları](#analiz-fonksiyonları)
6. [Veritabanı Şeması](#veritabanı-şeması)
7. [API Entegrasyonu](#api-entegrasyonu)
8. [Kredi Sistemi](#kredi-sistemi)
9. [Frontend Entegrasyonu](#frontend-entegrasyonu)
10. [Dosya Yapısı](#dosya-yapısı)

---

## 🎯 GENEL BAKIŞ

Backlink Bazaar projesi, **Raw-Analysis-Push** mimarisi ile çalışan bir veri analizi sistemi kullanmaktadır. Bu mimari, veri toplama, işleme ve saklama süreçlerini net bir şekilde ayırır.

### Temel Prensipler

- **RAW**: API'den gelen ham veri hiç işlenmeden saklanır
- **ANALYSIS**: İşlenmiş veriler veritabanındaki ham veriden türetilir (API'ye gitmez)
- **PUSH**: İşlenmiş veriler ayrı alanlarda saklanır (hızlı okuma için)

---

## 🏗️ MİMARİ: RAW-ANALYSIS-PUSH

### 1. RAW (Ham Veri Saklama)

**Amaç**: API'den gelen veriyi olduğu gibi saklamak

**Süreç**:
1. DataForSEO API'den veri çekilir
2. Veri hiç işlenmeden `rawSeoData` alanına kaydedilir
3. Multi-Region Storage formatında saklanır (location code bazlı)

**Dosya**: `src/lib/services/seo-manager.ts` - `analyzeSite()` fonksiyonu (101-259. satırlar)

**Özellikler**:
- API yanıtı olduğu gibi saklanır
- Metadata eklenir (`_metadata` objesi)
- Location code bazlı gruplama
- Eski format uyumluluğu (tasks dizisi kontrolü)

### 2. ANALYSIS (İşleme)

**Amaç**: Ham veriyi analiz edip işlenmiş veri üretmek

**Süreç**:
1. Veritabanındaki `rawSeoData` okunur
2. Algoritmalar çalıştırılır (Snappost Score hesaplama)
3. İşlenmiş veriler hesaplanır
4. API'ye gitmez, sadece DB'deki veriyi işler

**Dosya**: `src/lib/services/seo-manager.ts` - `reprocessSeoData()` fonksiyonu (734-835. satırlar)

**Özellikler**:
- Location code bazlı işleme
- Snappost Score hesaplama
- Traffic data çıkarımı
- Detailed metrics parse

### 3. PUSH (İşlenmiş Veri Saklama)

**Amaç**: Hızlı okuma için optimize edilmiş veri saklama

**Saklanan Veriler**:
- `snappostScore`: 0-100 arası otorite puanı
- `trafficData`: İşlenmiş trafik verileri (JSON)
- `lastSeoCheck`: Son analiz zamanı

---

## 📦 VERİ YAPISI: MULTI-REGION STORAGE

### Veri Formatı

```typescript
rawSeoData: {
  [locationCode: string]: {  // "2840", "2792", "global"
    [apiName: string]: {      // "historical_rank_overview", "ranked_keywords", etc.
      data: any;              // API response (tasks dizisi)
      timestamp: string;      // ISO 8601 formatında
    };
  };
}
```

### Örnek Yapı

```json
{
  "2840": {
    "historical_rank_overview": {
      "data": {
        "tasks": [...],
        "_metadata": {
          "api": "historical_rank_overview",
          "locationCode": 2840,
          "domain": "example.com",
          "fetchedAt": "2025-01-05T10:00:00Z"
        }
      },
      "timestamp": "2025-01-05T10:00:00Z"
    },
    "ranked_keywords": {
      "data": {...},
      "timestamp": "2025-01-05T11:00:00Z"
    },
    "serp_competitors": {
      "data": {...},
      "timestamp": "2025-01-05T12:00:00Z"
    },
    "relevant_pages": {
      "data": {...},
      "timestamp": "2025-01-05T13:00:00Z"
    },
    "domain_intersection": {
      "data": {...},
      "timestamp": "2025-01-05T14:00:00Z"
    }
  },
  "2792": {
    "historical_rank_overview": {
      "data": {...},
      "timestamp": "2025-01-05T15:00:00Z"
    }
  },
  "global": {
    "backlink_summary": {
      "data": {...},
      "timestamp": "2025-01-05T16:00:00Z"
    },
    "backlink_history": {
      "data": {...},
      "timestamp": "2025-01-05T17:00:00Z"
    }
  }
}
```

### Location Code'lar

- `2840`: Amerika Birleşik Devletleri (US)
- `2792`: Türkiye (TR)
- `2826`: Birleşik Krallık (UK)
- `2276`: Almanya (DE)
- `2250`: Fransa (FR)
- `2036`: Avustralya (AU)
- `2124`: Kanada (CA)
- `2752`: Hollanda (NL)
- `2032`: İspanya (ES)
- `2226`: İtalya (IT)
- `global`: Lokasyon bağımsız (backlink API'leri)

---

## 🔄 VERİ AKIŞI DİYAGRAMI

```
┌─────────────────────────────────────────────────────────────┐
│                    VERİ AKIŞI SÜRECİ                         │
└─────────────────────────────────────────────────────────────┘

1. API ÇAĞRISI (RAW)
   ┌──────────────┐
   │ User Action  │ → refreshSiteMetricsAction()
   └──────┬───────┘
          │
          v
   ┌──────────────┐
   │ analyzeSite()│ → Kredi kontrolü → DataForSEO API
   └──────┬───────┘
          │
          v
   ┌──────────────┐
   │appendApiData │ → Multi-Region Storage'a ekleme
   └──────┬───────┘
          │
          v
   ┌──────────────┐
   │Transaction   │ → rawSeoData güncelle + Kredi düş + Log
   └──────────────┘

2. İŞLEME (ANALYSIS)
   ┌──────────────┐
   │ User Action  │ → reprocessSeoDataAction()
   └──────┬───────┘
          │
          v
   ┌──────────────┐
   │reprocessSeo  │ → rawSeoData okuma (DB'den)
   │Data()        │
   └──────┬───────┘
          │
          v
   ┌──────────────┐
   │Veri Parse    │ → Location bazlı veri çıkarımı
   └──────┬───────┘
          │
          v
   ┌──────────────┐
   │calculateSnap │ → Algoritma çalıştırma
   │postScore()   │
   └──────┬───────┘
          │
          v
   ┌──────────────┐
   │DB Güncelle   │ → snappostScore + trafficData kaydet
   └──────────────┘

3. GÖRÜNTÜLEME (FRONTEND)
   ┌──────────────┐
   │ Page Render  │ → rawSeoData + snappostScore + trafficData
   └──────┬───────┘
          │
          v
   ┌──────────────┐
   │Data Parsing  │ → Helper fonksiyonlar ile veri çıkarımı
   └──────┬───────┘
          │
          v
   ┌──────────────┐
   │ UI Components│ → Veri kartları, tablolar, grafikler
   └──────────────┘
```

---

## 🎯 ANALİZ FONKSİYONLARI

### A. API Çağrı Fonksiyonları (Ham Veri Toplama)

#### 1. analyzeSite() - Ana Analiz
**Dosya**: `src/lib/services/seo-manager.ts:101-259`

**Parametreler**:
- `siteId: string` - Analiz edilecek site ID
- `agencyId: string` - İşlemi yapan ajans ID
- `locationCode: number` - Ülke lokasyon kodu (zorunlu)

**Süreç**:
1. Ajans kontrolü ve kredi kontrolü
2. Site bilgilerini alma
3. Domain validasyonu
4. DataForSEO API'den Historical Rank Overview verisi çekme
5. Multi-Region Storage formatına çevirme
6. Transaction ile kayıt (rawSeoData güncelleme, kredi düşme, log)

**Maliyet**: 1 kredi

**Döndürdüğü Veri**:
```typescript
{
  success: boolean;
  siteId: string;
  creditsRemaining: number;
  message?: string;
}
```

#### 2. fetchAndStoreRankedKeywords()
**Dosya**: `src/lib/services/seo-manager.ts:326-389`

**API**: `/dataforseo_labs/google/ranked_keywords/live`

**Maliyet**: 1 kredi

**Location**: Gerekli

#### 3. fetchAndStoreSerpCompetitors()
**Dosya**: `src/lib/services/seo-manager.ts:394-456`

**API**: `/dataforseo_labs/google/serp_competitors/live`

**Maliyet**: 1 kredi

**Location**: Gerekli

#### 4. fetchAndStoreRelevantPages()
**Dosya**: `src/lib/services/seo-manager.ts:461-523`

**API**: `/dataforseo_labs/google/relevant_pages/live`

**Maliyet**: 1 kredi

**Location**: Gerekli

#### 5. fetchAndStoreDomainIntersection()
**Dosya**: `src/lib/services/seo-manager.ts:528-590`

**API**: `/dataforseo_labs/google/domain_intersection/live`

**Maliyet**: 1 kredi

**Location**: Gerekli

#### 6. fetchAndStoreBacklinkSummary()
**Dosya**: `src/lib/services/seo-manager.ts:595-656`

**API**: `/backlinks/summary/live`

**Maliyet**: 1 kredi

**Location**: Gerekli değil (global)

#### 7. fetchAndStoreBacklinkHistory()
**Dosya**: `src/lib/services/seo-manager.ts:661-722`

**API**: `/backlinks/history/live`

**Maliyet**: 1 kredi

**Location**: Gerekli değil (global)

### B. İşleme Fonksiyonu (Analysis)

#### reprocessSeoData() - Veri İşleme
**Dosya**: `src/lib/services/seo-manager.ts:734-835`

**Parametreler**:
- `siteId: string` - İşlenecek site ID
- `locationCode?: number` - İşlenecek location code (opsiyonel, yoksa ilk location kullanılır)

**Süreç**:
1. Site ve rawSeoData'yı veritabanından alma
2. Multi-Region Storage'dan veriyi çıkarma
3. Location code belirleme (verilmişse onu kullan, yoksa ilk location)
4. historical_rank_overview verisini parse etme
5. İşlenmiş verileri hesaplama:
   - `trafficData`: estimatedTrafficValue, history[]
   - `detailedMetrics`: pos_1, pos_2_3, pos_4_10, pos_11_100, is_new, is_lost, total_keywords
6. Snappost Score hesaplama
7. Veritabanına işlenmiş verileri kaydetme

**Algoritma: calculateSnappostScore()**
**Dosya**: `src/lib/services/seo-manager.ts:35-77`

**Formül**:
```
Baz Puan = Log10(Traffic Value) * 10
Kalite Bonusu = (Top 3 Keyword / Top 100 Keyword) * 20
Trend Bonusu = (Is_New > Is_Lost) ? 5 : 0

Snappost Score = clamp(Baz Puan + Kalite Bonusu + Trend Bonusu, 0, 100)
```

**Döndürdüğü Veri**:
```typescript
{
  success: boolean;
  snappostScore: number | null;
  trafficData: {
    estimatedTrafficValue: number;
    history: Array<{ date: string; value: number }>;
  };
  message: string;
}
```

### C. Yardımcı Fonksiyonlar

#### appendApiDataToRawSeoData()
**Dosya**: `src/lib/services/seo-manager.ts:279-321`

**Amaç**: Yeni API verisini mevcut rawSeoData'ya ekler (Multi-Region Storage formatında)

**Özellikler**:
- Eski format uyumluluğu (tasks dizisi kontrolü)
- Location code bazlı gruplama
- API name bazlı kategorizasyon
- Timestamp ekleme

---

## 💾 VERİTABANI ŞEMASI

### Site Modeli

```prisma
model Site {
  id          String    @id @default(uuid())
  domain      String    @unique
  
  // RAW (Ham Veri) - Multi-Region Storage
  rawSeoData    Json?     // Ana Kasa: API'den gelen HAM veri
  lastSeoCheck  DateTime? // Son SEO kontrolü zamanı
  
  // PUSH (İşlenmiş Veri) - Hızlı Okuma
  snappostScore Int?      // Hesaplanmış otorite puanı (0-100)
  trafficData   Json?     // İşlenmiş trafik verileri
  // trafficData formatı:
  // {
  //   estimatedTrafficValue: number;
  //   history: Array<{ date: string; value: number }>;
  // }
}
```

### AgencyTransaction Modeli

```prisma
model AgencyTransaction {
  id          String   @id @default(uuid())
  agencyId    String
  amount      Int      // Pozitif: ekleme, Negatif: kullanım
  type        String   // CREDIT_PURCHASE, SEO_ANALYSIS, REFUND
  description String?
  createdAt   DateTime @default(now())
}
```

### User Modeli (Agency için)

```prisma
model User {
  id        String   @id @default(uuid())
  role      String   // PUBLISHER, AGENCY, BUYER, ADMIN
  credits   Int      @default(100) // Agency kredi sistemi
}
```

---

## 🔌 API ENTEGRASYONU

### DataForSEO API

**Base URL**: `https://api.dataforseo.com/v3/`

**Authentication**: Basic Auth (Base64 encoded)
```typescript
const token = Buffer.from(`${API_LOGIN}:${API_PASSWORD}`).toString('base64');
```

**Client Dosyası**: `src/lib/api/dataforseo.ts`

### Kullanılan Endpoint'ler (7/7)

#### 1. Historical Rank Overview
**Endpoint**: `/dataforseo_labs/google/historical_rank_overview/live`

**Parametreler**:
```typescript
{
  target: string;        // Domain (örn: "example.com")
  location_code: number; // Lokasyon kodu (örn: 2840)
  language_code: string; // "en"
}
```

**Kullanım**: Ana SEO analizi için

#### 2. Ranked Keywords
**Endpoint**: `/dataforseo_labs/google/ranked_keywords/live`

**Kullanım**: Sıralanan anahtar kelimeler

#### 3. SERP Competitors
**Endpoint**: `/dataforseo_labs/google/serp_competitors/live`

**Kullanım**: SERP'teki rakipler

#### 4. Relevant Pages
**Endpoint**: `/dataforseo_labs/google/relevant_pages/live`

**Kullanım**: İlgili sayfalar

#### 5. Domain Intersection
**Endpoint**: `/dataforseo_labs/google/domain_intersection/live`

**Kullanım**: Domain kesişimleri

#### 6. Backlink Summary
**Endpoint**: `/backlinks/summary/live`

**Parametreler**:
```typescript
{
  target: string; // Domain (location_code gerekmez)
}
```

**Kullanım**: Backlink özeti (global)

#### 7. Backlink History
**Endpoint**: `/backlinks/history/live`

**Kullanım**: Backlink geçmişi (global)

---

## 💳 KREDİ SİSTEMİ

### Kredi Kullanımı

- **Her API çağrısı**: 1 kredi
- **Kontrol**: Her API çağrısından önce
- **Transaction**: Prisma transaction ile atomik işlem
- **Log**: AgencyTransaction tablosuna kaydedilir

### Kredi Kontrol Süreci

```typescript
// 1. Ajans kontrolü
const agency = await prisma.user.findUnique({
  where: { id: agencyId },
  select: { credits: true, role: true }
});

// 2. Rol kontrolü
if (agency.role !== 'AGENCY') {
  throw new Error('Bu işlem sadece ajanslar tarafından yapılabilir');
}

// 3. Kredi kontrolü
const CREDIT_COST = 1;
if (agency.credits < CREDIT_COST) {
  throw new Error(`Yetersiz kredi. Mevcut: ${agency.credits}, Gerekli: ${CREDIT_COST}`);
}

// 4. Transaction ile kredi düşme
await prisma.$transaction(async (tx) => {
  // API çağrısı
  // Veri kaydetme
  // Kredi düşme
  await tx.user.update({
    where: { id: agencyId },
    data: { credits: { decrement: CREDIT_COST } }
  });
  // Log kaydı
  await tx.agencyTransaction.create({
    data: {
      agencyId: agencyId,
      amount: -CREDIT_COST,
      type: 'SEO_ANALYSIS',
      description: '...'
    }
  });
});
```

---

## 🎨 FRONTEND ENTEGRASyonU

### Server Actions

**Dosya**: `src/app/actions/seo-actions.ts`

#### refreshSiteMetricsAction()
- **Kullanım**: SEO metriklerini yenileme (ana analiz)
- **Parametreler**: `siteId`, `agencyId`, `locationCode`
- **Akış**: `analyzeSite()` çağrısı + cache temizleme

#### reprocessSeoDataAction()
- **Kullanım**: Ham veriyi yeniden işleme
- **Parametreler**: `siteId`, `locationCode?` (opsiyonel)
- **Akış**: `reprocessSeoData()` çağrısı + cache temizleme

#### fetchRankedKeywordsAction()
- **Kullanım**: Ranked Keywords API çağrısı
- **Parametreler**: `siteId`, `agencyId`, `locationCode`

#### fetchSerpCompetitorsAction()
- **Kullanım**: SERP Competitors API çağrısı
- **Parametreler**: `siteId`, `agencyId`, `locationCode`

#### fetchRelevantPagesAction()
- **Kullanım**: Relevant Pages API çağrısı
- **Parametreler**: `siteId`, `agencyId`, `locationCode`

#### fetchDomainIntersectionAction()
- **Kullanım**: Domain Intersection API çağrısı
- **Parametreler**: `siteId`, `agencyId`, `locationCode`

#### fetchBacklinkSummaryAction()
- **Kullanım**: Backlink Summary API çağrısı (global)
- **Parametreler**: `siteId`, `agencyId`

#### fetchBacklinkHistoryAction()
- **Kullanım**: Backlink History API çağrısı (global)
- **Parametreler**: `siteId`, `agencyId`

### Client Component

**Dosya**: `src/app/(dashboard)/agency/inventory/[id]/InventoryDetailClient.tsx`

#### Veri Parse Helper Fonksiyonları

```typescript
// Location bazlı veri erişimi
const getLocationData = (locationCode: number | null) => {
  if (!rawSeoData || !locationCode) return null;
  const locationKey = String(locationCode);
  return rawSeoData[locationKey] || null;
};

// API bazlı veri erişimi
const getApiData = (locationCode: number | null, apiName: string) => {
  const locationData = getLocationData(locationCode);
  if (!locationData || !locationData[apiName]) return null;
  return locationData[apiName].data;
};

// Global veri erişimi
const getGlobalData = (apiName: string) => {
  if (!rawSeoData) return null;
  const globalData = rawSeoData['global'] || rawSeoData['0'];
  if (!globalData || !globalData[apiName]) return null;
  return globalData[apiName].data;
};
```

#### Veri Parse Fonksiyonları

```typescript
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
```

#### Veri Görselleştirme

**Analiz Sonuçları Bölümü**:
- En Değerli Kelimeler Tablosu (ranked_keywords - İlk 10)
- Pazar Rakipleri Listesi (serp_competitors)
- Trafik Canavarı Sayfalar Listesi (relevant_pages)
- Otorite Kartı (backlink_summary - global)

---

## 📁 DOSYA YAPISI

### Ana Dosyalar

```
backlink-bazaar/
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   └── dataforseo.ts              # DataForSEO API client (7 endpoint)
│   │   └── services/
│   │       └── seo-manager.ts             # SEO analiz servisi (analiz fonksiyonları)
│   │
│   └── app/
│       ├── actions/
│       │   └── seo-actions.ts             # Server Actions (frontend entegrasyonu)
│       │
│       └── (dashboard)/
│           └── agency/
│               └── inventory/
│                   └── [id]/
│                       ├── page.tsx                    # Server Component (veri çekme)
│                       └── InventoryDetailClient.tsx   # Client Component (veri görselleştirme)
│
└── prisma/
    └── schema.prisma                      # Veritabanı şeması
```

### Önemli Fonksiyonlar ve Lokasyonları

| Fonksiyon | Dosya | Satırlar | Açıklama |
|-----------|-------|----------|----------|
| `analyzeSite()` | `src/lib/services/seo-manager.ts` | 101-259 | Ana SEO analizi (API çağrısı) |
| `reprocessSeoData()` | `src/lib/services/seo-manager.ts` | 734-835 | Veri işleme (API'ye gitmez) |
| `calculateSnappostScore()` | `src/lib/services/seo-manager.ts` | 35-77 | Snappost Score algoritması |
| `appendApiDataToRawSeoData()` | `src/lib/services/seo-manager.ts` | 279-321 | Multi-Region Storage'a ekleme |
| `fetchSeoData()` | `src/lib/api/dataforseo.ts` | 17-67 | Historical Rank Overview API |
| `fetchRankedKeywords()` | `src/lib/api/dataforseo.ts` | 79-122 | Ranked Keywords API |
| `fetchSerpCompetitors()` | `src/lib/api/dataforseo.ts` | 127-170 | SERP Competitors API |
| `fetchRelevantPages()` | `src/lib/api/dataforseo.ts` | 175-218 | Relevant Pages API |
| `fetchDomainIntersection()` | `src/lib/api/dataforseo.ts` | 223-266 | Domain Intersection API |
| `fetchBacklinkSummary()` | `src/lib/api/dataforseo.ts` | 271-307 | Backlink Summary API |
| `fetchBacklinkHistory()` | `src/lib/api/dataforseo.ts` | 312-348 | Backlink History API |
| `refreshSiteMetricsAction()` | `src/app/actions/seo-actions.ts` | 37-77 | SEO metrikleri yenileme (Server Action) |
| `reprocessSeoDataAction()` | `src/app/actions/seo-actions.ts` | 86-124 | Veri yeniden işleme (Server Action) |

---

## 🔍 ÖNEMLİ NOTLAR VE SINIRLAMALAR

### Veri Saklama

- **rawSeoData**: JSON formatında saklanır (Prisma `Json` tipi)
- **Veri boyutu**: Kontrol edilmeli (örnek: 200+ KB olabilir)
- **Eski format uyumluluğu**: Tasks dizisi formatından yeni formata otomatik çevirme

### İşleme Süreci

- **Location seçimi**: `reprocessSeoData()` fonksiyonunda location code verilmemişse ilk location kullanılır
- **Veri bağımlılığı**: `reprocessSeoData()` çalıştırmadan önce `rawSeoData` olmalı
- **API çağrısı**: `reprocessSeoData()` API'ye gitmez, sadece DB'deki veriyi işler

### Kredi Sistemi

- **Atomik işlem**: Transaction ile güvenli kredi düşme
- **Hata durumu**: API hatası durumunda kredi düşmez
- **Log kaydı**: Her işlem AgencyTransaction tablosuna kaydedilir

### Frontend Entegrasyonu

- **Cache temizleme**: Her Server Action sonrası `revalidatePath()` çağrılır
- **Sayfa yenileme**: API çağrısı sonrası `router.refresh()` + `window.location.reload()` kombinasyonu
- **Type Safety**: `RawSeoDataMultiRegion` interface ile type-safe veri erişimi

---

## 📊 PERFORMANS VE ÖLÇEKLENDİRİLEBİLİRLİK

### Mevcut Durum

- **Veri boyutu**: Her location için ~50-200 KB ham veri
- **İşleme süresi**: `reprocessSeoData()` ~100-500ms (location bazlı)
- **API çağrı süresi**: DataForSEO API ~2-10 saniye (endpoint'e göre değişir)

### Potansiyel İyileştirmeler

- **Caching**: Sık kullanılan location'lar için cache
- **Batch processing**: Birden fazla location'ı aynı anda işleme
- **Background jobs**: Uzun süren API çağrıları için queue sistemi
- **Veri sıkıştırma**: rawSeoData için compression

---

**Son Güncelleme**: 2025-01-05  
**Doküman Versiyonu**: 1.0  
**Hazırlayan**: AI Assistant

