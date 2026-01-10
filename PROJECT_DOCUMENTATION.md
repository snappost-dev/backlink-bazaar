# 📚 BACKLINK BAZAAR - KAPSAMLI PROJE DOKÜMANTASYONU

**Versiyon:** 1.1  
**Son Güncelleme:** 2025-01-05  
**Durum:** Aktif Geliştirme (Railway Production)

---

## 📋 İÇİNDEKİLER

1. [Proje Özeti](#proje-özeti)
2. [Mimari Genel Bakış](#mimari-genel-bakış)
3. [Teknik Altyapı](#teknik-altyapı)
4. [Veritabanı Şeması](#veritabanı-şeması)
5. [Rol Bazlı Sistem](#rol-bazlı-sistem)
6. [API Entegrasyonları](#api-entegrasyonları)
7. [Veri Akışı ve İşleme](#veri-akışı-ve-işleme)
8. [Frontend Veri Görselleştirme](#frontend-veri-görselleştirme)
9. [Güvenlik ve Protokoller](#güvenlik-ve-protokoller)
10. [Geliştirme Durumu](#geliştirme-durumu)
11. [Klasör Yapısı](#klasör-yapısı)

---

## 🎯 PROJE ÖZETİ

**Backlink Bazaar**, Snappost ekosisteminin "Borsa" ayağıdır. Platform, backlink alışverişini yönetmek için üç ana aktörü bir araya getirir:

- **Yayıncılar (Publishers)**: Web sitelerini platforma ekler, doğrular ve backlink satışından gelir elde eder
- **Ajanslar (Agencies)**: Siteleri analiz eder, doğrular, fiyatlandırır ve müşterilerine hizmet verir
- **Alıcılar (Buyers)**: Doğrulanmış sitelerden backlink satın alır

### Temel Özellikler

- ✅ **Çoklu Rol Sistemi**: Publisher, Agency, Buyer, Admin rolleri
- ✅ **SEO Analiz Motoru**: DataForSEO API entegrasyonu ile derinlemesine site analizi
- ✅ **Kredi Sistemi**: Ajanslar için kredi tabanlı analiz hizmeti
- ✅ **Raw-Analysis-Push Mimarisi**: Ham veri saklama ve işleme ayrımı
- ✅ **Multi-Region Storage**: Farklı lokasyon kodları için veri saklama
- ✅ **Snapshot History**: Zaman içindeki değişiklikleri takip etme
- ✅ **Briefcase Sistemi**: Sipariş anında metin, veri ve talimatların paketlenmesi
- ✅ **Frontend Veri Görselleştirme**: Dinamik analiz sonuçları ve veri kartları

---

## 🏗️ MİMARİ GENEL BAKIŞ

### Genel Mimari Prensipler

1. **Role-Based Layout**: Her rol için özelleştirilmiş dashboard ve navigasyon
2. **Force Dynamic Rendering**: Tüm dashboard sayfaları `force-dynamic` modunda çalışır (Railway uyumluluğu)
3. **Frontend-First Approach**: UI mock data ile hızlı geliştirme
4. **Immutable ID System**: Tüm tablolarda UUID (v4) kullanımı
5. **Transaction Safety**: Kritik işlemler Prisma transaction ile korunur

### Veri Giriş Kapıları (Data Entry Gates)

Platform iki farklı veri giriş kapısına sahiptir:

#### A. Publisher Gate (Public)
- **Route**: `/publisher/inventory`
- **Akış**: Crawler veri çeker → Status: `PENDING` → Doğrulama gerekir
- **Kullanım**: Yayıncılar kendi sitelerini ekler

#### B. Agency Gate (Private)
- **Route**: `/agency/inventory`
- **Akış**: Crawler veri çeker → Status: `UNVERIFIED` → Ajans panelinde hemen görünür
- **Kullanım**: Ajanslar portföylerini ekler

---

## 💻 TEKNİK ALTYAPI

### Stack

| Kategori | Teknoloji | Versiyon |
|----------|-----------|----------|
| **Framework** | Next.js | 14.2.0 |
| **UI Library** | React | 18.2.0 |
| **Styling** | Tailwind CSS | 3.4.0 |
| **Database ORM** | Prisma | 7.2.0 |
| **Database** | PostgreSQL | (Railway) |
| **Vector Extension** | pgvector | 0.2.1 (Geçici devre dışı) |
| **HTTP Client** | Axios | 1.13.2 |
| **Web Scraping** | Cheerio | 1.1.2 |
| **Icons** | Lucide React | 0.400.0 |
| **Charts** | Recharts | 3.6.0 |

### Hosting ve Deployment

- **Production**: Railway
- **Database**: PostgreSQL (Railway)
- **Build Strategy**: Force Dynamic (Static generation yok)
- **Environment**: Production-ready

### Önemli Konfigürasyonlar

```typescript
// Tüm dashboard sayfalarında
export const dynamic = 'force-dynamic';
```

Bu ayar, Railway'de "Export Error" hatalarını önler ve cache sorunlarını çözer.

---

## 🗄️ VERİTABANI ŞEMASI

### Ana Tablolar

#### 1. **User** (Kullanıcılar)
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  role      String   // PUBLISHER, AGENCY, BUYER, ADMIN
  credits   Int      @default(100) // Agency kredi sistemi
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Özellikler:**
- UUID tabanlı ID (Immutable)
- Role-based erişim kontrolü
- Agency'ler için kredi sistemi

#### 2. **Site** (Siteler)
```prisma
model Site {
  id          String    @id @default(uuid())
  domain      String    @unique
  status      String    // verified, pending, rejected
  category    String
  basePrice   Float
  finalPrice  Float
  metrics     Json      // { da, dr, spam }
  traffic     Json      // { monthly, organic, referral }
  
  // Data Entry Gates
  origin             String  @default("PUBLISHER_OWNED")
  verificationStatus String  @default("PENDING")
  isPrivate          Boolean @default(false)
  
  // SEO Data (Raw-Analysis-Push)
  rawSeoData    Json?     // HAM veri (Multi-Region Storage)
  snappostScore Int?      // İşlenmiş: 0-100 otorite puanı
  trafficData   Json?     // İşlenmiş: Trafik verileri
  lastSeoCheck  DateTime?
}
```

**Önemli Notlar:**
- `rawSeoData`: Multi-Region Storage formatında saklanır
- `snappostScore`: Hesaplanmış otorite puanı (0-100)
- `basePrice` vs `finalPrice`: Fiyat maskeleme için

#### 3. **ScoutingHistory** (Zaman Makinesi)
```prisma
model ScoutingHistory {
  id          String   @id @default(uuid())
  siteId      String
  agencyId    String
  snapshotData Json    // Immutable snapshot
  diffSummary String?
  createdAt   DateTime @default(now())
}
```

**Prensip**: Never UPDATE, always INSERT (Gary Protocol)

#### 4. **Order** (Siparişler)
```prisma
model Order {
  id     String @id @default(uuid())
  siteId String
  buyerId String
  
  status String // pending, approved, in_progress, completed, cancelled
  
  // Pricing
  price      Float
  finalPrice Float?
  
  // The Briefcase
  draftBrief    Json? // Buyer'ın girdiği veri
  approvedBrief Json? // Agency'nin onayladığı versiyon
  briefStatus   String @default("PENDING")
  
  deadline      DateTime?
  completedAt   DateTime?
  publishedLink String?
}
```

#### 5. **AgencyTransaction** (Kredi İşlemleri)
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

#### 6. **ValuationRule** (Fiyatlandırma Kuralları)
```prisma
model ValuationRule {
  id                String   @id @default(uuid())
  minDoz            Int      @default(0)
  trafficMultiplier Decimal  @default(1.0)
  baseFloor         Decimal  @default(50.0)
  categoryMultipliers Json?
  isActive          Boolean  @default(true)
}
```

### İndeksler

Tüm kritik alanlar indekslenmiştir:
- `publisherId`, `status`, `origin`, `verificationStatus` (Site)
- `siteId`, `agencyId`, `createdAt` (ScoutingHistory)
- `siteId`, `buyerId`, `status` (Order)

---

## 👥 ROL BAZLI SİSTEM

### 1. PUBLISHER (Yayıncı) - Mavi Tema

**Renk**: `bg-blue-600`  
**Odak**: Envanter, Para, Doğrulama

**Sayfalar:**
- `/publisher/inventory` - Site envanteri
- `/publisher/verification` - Doğrulama hub'ı
- `/publisher/wallet` - Cüzdan ve gelirler
- `/publisher/analytics` - İstatistikler

**Özellikler:**
- Site ekleme sihirbazı
- GSC bağlantısı
- Universal Snippet doğrulama
- Kademeli şeffaflık (ajans fiyatı vs yayıncı kazancı)

### 2. AGENCY (Ajans) - İndigo Tema

**Renk**: `bg-indigo-600`  
**Odak**: Analiz, Vetting, Fiyatlandırma

**Sayfalar:**
- `/agency/vetting` - Keşif havuzu (Vetting Pool)
- `/agency/inventory` - Ajans envanteri
- `/agency/workroom` - Fiyat simülatörü
- `/agency/whitelabel` - Whitelabel ayarları
- `/agency/analytics` - Ajans istatistikleri

**Özellikler:**
- Deep Insight (derin analiz)
- SEO analiz motoru (kredi sistemi ile)
- Fiyat markup hesaplama
- Site onaylama/reddetme
- Maskelenmiş URL görünümü

### 3. BUYER (Alıcı) - Slate/Siyah Tema

**Renk**: `bg-slate-900`  
**Odak**: Alışveriş, Sipariş

**Sayfalar:**
- `/buyer/marketplace` - Doğrulanmış siteler vitrini
- `/buyer/orders` - Sipariş geçmişi
- `/buyer/analytics` - Alıcı istatistikleri

**Özellikler:**
- Sepete ekleme
- Briefing Wizard (sipariş çantası)
- Sadece `APPROVED` siteleri görme
- `finalPrice` görme (basePrice değil)

### 4. ADMIN (Yönetici) - Kırmızı Tema

**Renk**: `bg-red-600`  
**Odak**: Denetim, Sistem Yönetimi

**Sayfalar:**
- `/admin/dashboard` - Global TVL ve loglar
- Role switcher (header üzerinde)

---

## 🔌 API ENTEGRASYONLARI

### DataForSEO API

**Base URL**: `https://api.dataforseo.com/v3/`  
**Authentication**: Basic Auth (Base64 encoded)

#### Kullanılan Endpoint'ler (7/7)

1. **Historical Rank Overview** (`/dataforseo_labs/google/historical_rank_overview/live`)
   - Domain'in tarihsel sıralama verileri
   - Traffic value, keyword pozisyonları

2. **Ranked Keywords** (`/dataforseo_labs/google/ranked_keywords/live`)
   - Sıralanan anahtar kelimeler
   - Top keywords listesi

3. **SERP Competitors** (`/dataforseo_labs/google/serp_competitors/live`)
   - SERP'teki rakipler
   - Rekabet analizi

4. **Relevant Pages** (`/dataforseo_labs/google/relevant_pages/live`)
   - İlgili sayfalar
   - İçerik analizi

5. **Domain Intersection** (`/dataforseo_labs/google/domain_intersection/live`)
   - Domain kesişimleri
   - Backlink analizi

6. **Backlink Summary** (`/backlinks/summary/live`)
   - Backlink özeti
   - Domain otoritesi

7. **Backlink History** (`/backlinks/history/live`)
   - Backlink geçmişi
   - Trend analizi

#### API Kullanım Akışı

```typescript
// 1. Kredi kontrolü
const agency = await prisma.user.findUnique({ where: { id: agencyId } });
if (agency.credits < CREDIT_COST) throw new Error('Yetersiz kredi');

// 2. API çağrısı
const rawSeoData = await fetchSeoData(domain, locationCode);

// 3. Transaction ile kayıt
await prisma.$transaction(async (tx) => {
  await tx.site.update({ data: { rawSeoData } });
  await tx.user.update({ data: { credits: { decrement: CREDIT_COST } } });
  await tx.agencyTransaction.create({ data: { ... } });
});
```

---

## 📊 VERİ AKIŞI VE İŞLEME

### Raw-Analysis-Push Mimarisi

Bu mimari, veri işleme ve saklama arasında net bir ayrım yapar:

#### 1. RAW (Ham Veri)
- API'den gelen veri **hiç işlenmeden** `rawSeoData` alanına kaydedilir
- Multi-Region Storage formatında saklanır:
```json
{
  "2840": {  // Location Code (US)
    "historical_rank_overview": {
      "data": { /* API response */ },
      "timestamp": "2025-01-04T..."
    },
    "ranked_keywords": { ... }
  },
  "2792": {  // Location Code (TR)
    "historical_rank_overview": { ... }
  }
}
```

#### 2. ANALYSIS (İşleme)
- `reprocessSeoData()` fonksiyonu ile ham veri işlenir
- Snappost Score hesaplanır (0-100)
- Traffic data çıkarılır
- **API'ye gitmez**, sadece veritabanındaki veriyi işler

#### 3. PUSH (Kayıt)
- İşlenmiş veriler `snappostScore` ve `trafficData` alanlarına kaydedilir
- Hızlı okuma için optimize edilmiş format

### Snappost Score Hesaplama

```typescript
function calculateSnappostScore(metrics) {
  // 1. Baz Puan: Log10(Traffic Value) * 10
  let baseScore = Math.log10(trafficValue) * 10;
  
  // 2. Kalite Bonusu: (Top 3 Keyword / Top 100 Keyword) * 20
  const qualityBonus = (top3Ratio) * 20;
  
  // 3. Trend Bonusu: Is_Up > Is_Down ise +5
  const trendBonus = (isNew > isLost) ? 5 : 0;
  
  // 0-100 arasına sıkıştır
  return Math.max(0, Math.min(100, totalScore));
}
```

### Multi-Region Storage

Farklı lokasyon kodları için aynı domain'in verileri ayrı ayrı saklanır:
- `2840` (US) → ABD pazarı verileri
- `2792` (TR) → Türkiye pazarı verileri
- `global` → Lokasyon bağımsız veriler (backlink API'leri)

---

## 🎨 FRONTEND VERİ GÖRSELLEŞTİRME

### Type Safety (TypeScript)

Frontend'de `rawSeoData` için type-safe interface tanımı:

```typescript
interface RawSeoDataMultiRegion {
  [locationCode: string]: {
    [apiName: string]: {
      data: any;
      timestamp?: string;
    };
  };
}
```

Bu yapı, Prisma'nın `Json` tipinden gelen verileri TypeScript tarafında güvenli bir şekilde kullanmamıza olanak sağlar.

### Analiz Sonuçları Bölümü

**Konum**: `/agency/inventory/[id]` - InventoryDetailClient bileşeni

**Özellikler:**
- Dinamik içerik: `selectedLocationCode` (`globalMarketCode`) değiştiğinde otomatik güncellenir
- Veri parse helper fonksiyonları ile güvenli veri erişimi
- Responsive grid layout (1-2 kolonlu)

### Veri Kartları

#### 1. En Değerli Kelimeler Tablosu
- **Veri Kaynağı**: `rawSeoData[locationCode].ranked_keywords`
- **Gösterim**: İlk 10 kelime
- **Kolonlar**: 
  - Kelime
  - Hacim (Search Volume)
  - CPC ($)
  - Niyet (Intent: Bilgi/Ticari/Satın Alma)
  - Zorluk (Keyword Difficulty)

#### 2. Pazar Rakipleri Listesi
- **Veri Kaynağı**: `rawSeoData[locationCode].serp_competitors`
- **Gösterim**: İlk 20 rakip
- **Bilgiler**:
  - Rakip Domain
  - Alaka Skoru (Relevance Score)
  - Ortak Kelimeler (Common Keywords)

#### 3. Trafik Canavarı Sayfalar Listesi
- **Veri Kaynağı**: `rawSeoData[locationCode].relevant_pages`
- **Gösterim**: İlk 20 sayfa
- **Bilgiler**:
  - URL
  - Tahmini Trafik (Estimated Traffic)
  - Tahmini Maliyet (Estimated Paid Traffic Cost)

#### 4. Otorite Kartı
- **Veri Kaynağı**: `rawSeoData.global.backlink_summary`
- **Gösterim**: Global backlink özeti
- **Metrikler**:
  - Trust Score
  - Toplam Backlink
  - Domain Sayısı
  - Ortalama Backlink/Domain

### Kullanıcı Akışı

1. Kullanıcı "Ranked Keywords" (veya diğer API) butonuna tıklar
2. Onay modalı gösterilir (kredi uyarısı ile)
3. API çağrısı yapılır ve veri `rawSeoData`'ya kaydedilir
4. Sayfa otomatik yenilenir (`router.refresh()` + `window.location.reload()`)
5. "Analiz Sonuçları" bölümünde ilgili veri kartı görünür

### Veri Parse Helper Fonksiyonları

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

// Global veri erişimi (backlink API'leri için)
const getGlobalData = (apiName: string) => {
  if (!rawSeoData) return null;
  const globalData = rawSeoData['global'] || rawSeoData['0'];
  if (!globalData || !globalData[apiName]) return null;
  return globalData[apiName].data;
};
```

### UI/UX Özellikleri

- **Renk Kodlaması**: Her veri kartı farklı renk teması (indigo, purple, green)
- **Responsive Design**: Mobil ve desktop uyumlu grid layout
- **Scrollable Lists**: Uzun listeler için max-height ve overflow-y
- **Hover Effects**: Tablo satırları ve liste öğeleri için hover durumları
- **Badge System**: Intent ve skorlar için renkli badge'ler

---

## 🔒 GÜVENLİK VE PROTOKOLLER

### Gary's Protocols (Snappost Backend Kuralları)

#### 1. Immutable ID
- Tüm tablolarda UUID (v4) kullanımı zorunludur
- ID'ler asla değiştirilemez

#### 2. Fiyat Maskeleme
- Alıcı API isteklerinde **asla** `basePrice` dönmemeli
- Sadece komisyonlu `finalPrice` dönmeli
- Yayıncılar ajansın kâr marjını göremez

#### 3. Snapshot History
- Ajans bir siteyi analiz ettiğinde, veriler `ScoutingHistory` tablosuna JSON snapshot olarak kaydedilir
- **Never UPDATE, always INSERT** prensibi
- Zaman içindeki değişiklikleri takip etmek için

#### 4. Kademeli Şeffaflık
- Yayıncılar: Ajansın kâr marjını değil, sadece ortalama satış fiyatını görebilir
- Ajanslar: Tüm fiyat bilgilerine erişebilir
- Alıcılar: Sadece `finalPrice` görür

### Veri Doğrulama

- Domain validasyonu: Regex ile format kontrolü
- Location code kontrolü: Zorunlu ve geçerli değer olmalı
- Kredi kontrolü: Her API çağrısından önce

---

## 📈 GELİŞTİRME DURUMU

### Tamamlanan Özellikler ✅

- [x] Dashboard layout ve role-based navigation
- [x] Publisher inventory listesi
- [x] Agency vetting pool (kart görünümü)
- [x] Admin dashboard (global TVL)
- [x] DataForSEO API entegrasyonu (7/7 endpoint)
- [x] Raw-Analysis-Push mimarisi
- [x] Multi-Region Storage
- [x] Kredi sistemi ve transaction log
- [x] Snappost Score hesaplama
- [x] Site analiz API'si (`/api/sites/analyze`)
- [x] Agency inventory detail sayfası
- [x] Frontend veri görselleştirme (Analiz Sonuçları bölümü)
- [x] Type-safe rawSeoData interface (RawSeoDataMultiRegion)
- [x] Dinamik veri kartları (ranked_keywords, serp_competitors, relevant_pages, backlink_summary)
- [x] Otomatik sayfa yenileme (API çağrısı sonrası)

### Devam Eden Özellikler 🚧

- [ ] Publisher: Site ekleme sihirbazı
- [ ] Publisher: Doğrulama hub (GSC bağlantısı, Universal Snippet)
- [x] Agency: Deep Insight (detay sayfası, grafikler) - ✅ Analiz Sonuçları bölümü eklendi
- [ ] Agency: Gelişmiş filtreler (kategori, Trust Score, trafik)
- [ ] Agency: Fiyat simülatörü (Workroom)
- [ ] Buyer: Marketplace (sepete ekle, sipariş ver)
- [ ] Buyer: Briefing Wizard (sipariş çantası)
- [ ] Order flow: Sipariş oluşturma ve yönetimi

### Gelecek Özellikler 🔮

- [ ] Vector embeddings (pgvector extension)
- [ ] Topical DNA engine (OpenAI embeddings)
- [ ] Whitelabel subdomain yönlendirmesi
- [ ] Real-time notifications
- [ ] Payment gateway entegrasyonu

---

## 📁 KLASÖR YAPISI

```
backlink-bazaar/
├── prisma/
│   ├── schema.prisma          # Veritabanı şeması
│   ├── seed.ts                # Seed script
│   └── migrations/            # Migration dosyaları
│
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth sayfaları (login)
│   │   ├── (dashboard)/       # Dashboard layout
│   │   │   ├── publisher/     # Publisher modülü
│   │   │   ├── agency/        # Agency modülü
│   │   │   ├── buyer/         # Buyer modülü
│   │   │   └── admin/         # Admin modülü
│   │   ├── api/               # API routes
│   │   │   ├── sites/         # Site API'leri
│   │   │   └── orders/        # Order API'leri
│   │   └── actions/           # Server actions
│   │
│   ├── components/
│   │   ├── layout/            # Layout bileşenleri
│   │   ├── publisher/         # Publisher bileşenleri
│   │   ├── agency/            # Agency bileşenleri
│   │   ├── buyer/             # Buyer bileşenleri
│   │   └── ui/                # UI bileşenleri (shadcn)
│   │
│   └── lib/
│       ├── api/               # External API entegrasyonları
│       │   └── dataforseo.ts  # DataForSEO client
│       ├── services/          # Business logic
│       │   └── seo-manager.ts # SEO analiz servisi
│       ├── prisma.ts          # Prisma client
│       ├── mock-data.ts       # Mock data (development)
│       └── utils.ts           # Utility fonksiyonlar
│
├── TECHNICAL_ARCH.md          # Teknik mimari dokümanı
├── PROJECT_BLUEPRINT.md       # Proje planı
├── ROADMAP.md                 # Yol haritası
├── FRONTEND_DNA.md            # Frontend tasarım sistemi
└── PROJECT_DOCUMENTATION.md   # Bu doküman
```

### Önemli Dosyalar

- **`src/app/(dashboard)/layout.tsx`**: Role-based sidebar ve navigation
- **`src/lib/api/dataforseo.ts`**: DataForSEO API client (7 endpoint)
- **`src/lib/services/seo-manager.ts`**: SEO analiz ve işleme servisi
- **`prisma/schema.prisma`**: Veritabanı şeması (6 ana model)
- **`src/lib/mock-data.ts`**: Development için mock data

---

## 🚀 HIZLI BAŞLANGIÇ

### Gereksinimler

- Node.js 18+
- PostgreSQL (Railway veya local)
- DataForSEO API credentials

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Veritabanı migration'larını çalıştır
npx prisma migrate dev

# Seed data (opsiyonel)
npm run prisma:seed

# Development server'ı başlat
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://..."
DATAFORSEO_LOGIN="admin@snappost.app"
DATAFORSEO_PASSWORD="..."
```

---

## 📝 NOTLAR VE UYARILAR

### Kritik Kurallar (Asla Bozulmamalı)

1. **No Mock Data in Production**: Production'da asla `mock-data.ts` kullanma
2. **Force Dynamic**: Tüm dashboard sayfaları `force-dynamic` olmalı
3. **Vector Type**: Prisma schema'da `Unsupported("vector(1536)")` kullanımı (pgvector extension gerekli)
4. **Immutable Snapshots**: `ScoutingHistory` tablosuna UPDATE yapma, sadece INSERT

### Bilinen Sorunlar

- pgvector extension geçici olarak devre dışı (veritabanında yüklü değil)
- SiteDNA modeli şu an kullanılmıyor (vector extension gerekli)
- Whitelabel subdomain yönlendirmesi henüz implement edilmedi

---

## 📞 İLETİŞİM VE KAYNAKLAR

- **Proje Adı**: Backlink Bazaar
- **Public URL**: exchange.snappost.app (planlanan)
- **Referans**: Snappost Master Bundle v5.6
- **Mimari Doküman**: TECHNICAL_ARCH.md
- **Proje Planı**: PROJECT_BLUEPRINT.md

---

**Son Güncelleme**: 2025-01-05  
**Doküman Versiyonu**: 1.1  
**Proje Durumu**: Aktif Geliştirme

### Son Güncellemeler (v1.1)

- ✅ Frontend Veri Görselleştirme: Analiz Sonuçları bölümü eklendi
- ✅ Type Safety: RawSeoDataMultiRegion interface tanımlandı
- ✅ Dinamik Veri Kartları: ranked_keywords, serp_competitors, relevant_pages, backlink_summary
- ✅ Otomatik Sayfa Yenileme: API çağrısı sonrası veri görselleştirme

