# 🔐 ENVIRONMENT VARIABLES TEMPLATE

**Tarih:** 2025-01-05  
**Durum:** ✅ Template Hazır  
**Kullanım:** `.env.local` dosyasına bu değerleri ekleyin

---

## 📋 GEREKLİ ENVIRONMENT VARIABLES

### Mevcut (Zaten Var Olabilir)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/backlink_bazaar"

# DataForSEO API
DATAFORSEO_LOGIN=your_datforseo_login
DATAFORSEO_PASSWORD=your_datforseo_password

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🆕 YENİ ENVIRONMENT VARIABLES (Hybrid SEO Engine v2.0)

### Cloudflare Worker Configuration

```env
# CF Worker endpoint URL (Local Audit için)
CF_WORKER_URL=https://seo-worker.snappost.com

# CF Worker API Key (Opsiyonel - eğer gerekiyorsa)
CF_WORKER_API_KEY=optional_if_needed

# Local Audit Threshold (Opsiyonel - Default: 30)
# Eğer local audit score 30'dan düşükse, Phase 1 (DFS) atlanır
LOCAL_AUDIT_THRESHOLD=30
```

### Google Gemini AI Manager Configuration

```env
# Google Gemini API Key (AI Manager - Investment Insights)
# Get your API key from: https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=your_google_api_key_here
```

---

## 📝 KURULUM ADIMLARI

### Adım 1: `.env.local` Dosyasını Kontrol Et
```bash
cd /home/aurora/backlink-bazaar
ls -la .env.local

# Yoksa oluştur
touch .env.local
```

### Adım 2: Yeni Değişkenleri Ekle
`.env.local` dosyasını açın ve şu satırları ekleyin:

```env
# Cloudflare Worker Configuration (Hybrid SEO Engine v2.0)
CF_WORKER_URL=https://seo-worker.snappost.com
CF_WORKER_API_KEY=optional_if_needed
LOCAL_AUDIT_THRESHOLD=30

# Google Gemini API (AI Manager - Investment Insights)
GOOGLE_API_KEY=your_google_api_key_here
```

### Adım 3: Next.js Dev Server Restart
```bash
# Ctrl+C ile durdur
npm run dev  # Tekrar başlat
```

---

## ⚠️ NOTLAR

### 1. CF_WORKER_URL Henüz Hazır Değilse
Geçici olarak mock endpoint kullanabilirsiniz:
```env
CF_WORKER_URL=https://httpbin.org/post  # Mock endpoint (test için)
```

Veya Phase 0 atlanabilir (non-blocking - Phase 1 devam eder).

### 2. LOCAL_AUDIT_THRESHOLD
Bu değer, local audit score'u belirtilen değerin altındaysa Phase 1 (DataForSEO) çağrılarını atlamak için kullanılır.
- **Default:** 30
- **Opsiyonel:** Bu satırı eklemezseniz, default değer 30 kullanılır
- **Etkisi:** Local audit score 30'un altındaysa, DFS API çağrıları yapılmaz (kredi tasarrufu)

### 3. Google Gemini API Key
**Durum:** AI Manager için gerekli (opsiyonel - yoksa AI insights devre dışı kalır)  
**Nasıl Alınır:**
1. https://makersuite.google.com/app/apikey adresine git
2. Google hesabınla giriş yap
3. "Create API Key" butonuna tıkla
4. API key'i kopyala ve `.env.local` dosyasına ekle

**Not:** Eğer `GOOGLE_API_KEY` tanımlı değilse, `generateSiteInsights()` fonksiyonu `null` döner (graceful degradation - uygulama çalışmaya devam eder).

### 4. Production Deployment (Railway)
Railway dashboard'dan da environment variables eklemeniz gerekebilir:
1. Railway dashboard'a git
2. Project → Variables
3. Yeni değişkenleri ekle:
   - `CF_WORKER_URL`
   - `CF_WORKER_API_KEY` (opsiyonel)
   - `LOCAL_AUDIT_THRESHOLD` (opsiyonel)
   - `GOOGLE_API_KEY` (AI Manager için)

---

## ✅ KONTROL

### Environment Variables Kontrol Et
```bash
# Next.js dev server'da kontrol
npm run dev

# Console'da şu hata olmamalı:
# ❌ "CF_WORKER_URL is not defined"
# ✅ "CF_WORKER_URL=https://seo-worker.snappost.com" görünmeli
```

### Code'da Kontrol
`src/lib/api/cloudflare-worker.ts` dosyasında:
```typescript
const CF_WORKER_URL = process.env.CF_WORKER_URL || 'https://seo-worker.snappost.com';
```

Eğer `CF_WORKER_URL` tanımlı değilse, default değer kullanılır.

`src/lib/services/ai-manager.ts` dosyasında:
```typescript
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
```

Eğer `GOOGLE_API_KEY` tanımlı değilse, AI insights fonksiyonu `null` döner (graceful degradation).

---

## 📚 İLGİLİ DOSYALAR

- **Migration Checklist:** `MIGRATION_CHECKLIST.md`
- **Quick Start:** `QUICK_START_TOMORROW.md`
- **Implementation Status:** `IMPLEMENTATION_STATUS.md`

---

**Son Güncelleme:** 2025-01-05  
**Hazırlayan:** AI Assistant  
**Durum:** ✅ Template Hazır - `.env.local` dosyasına eklenmeli

