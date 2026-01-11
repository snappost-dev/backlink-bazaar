# ✅ HYBRID SEO ENGINE v2.0 - MIGRATION CHECKLIST

**Tarih:** 2025-01-05  
**Durum:** ⚠️ Migration Bekliyor  
**Tahmini Süre:** 15-30 dakika

---

## 📋 ÖN HAZIRLIK KONTROLÜ

### ✅ Kod Implementasyonu
- [x] Prisma schema güncellendi (`schema.prisma`)
- [x] Migration dosyası oluşturuldu (`20250105120000_add_hybrid_seo_scores/migration.sql`)
- [x] Type definitions oluşturuldu (`src/lib/types/seo.ts`)
- [x] CF Worker client oluşturuldu (`src/lib/api/cloudflare-worker.ts`)
- [x] Skorlama fonksiyonları yazıldı (`seo-manager.ts`)
- [x] Frontend component oluşturuldu (`HealthCheckPanel.tsx`)
- [x] Props ve query'ler güncellendi (`InventoryDetailClient.tsx`, `page.tsx`)

### ⚠️ Yapılması Gerekenler (ÖNCELİK SIRASI)

---

## 🔴 1. MIGRATION ÇALIŞTIR (KRİTİK - 5 DAKİKA)

### Adım 1.1: Prisma Client Generate
```bash
cd /home/aurora/backlink-bazaar
npx prisma generate
```

**Beklenen Çıktı:** `Prisma Client generated successfully`

### Adım 1.2: Migration Çalıştır (Seçenekler)

#### Seçenek A: Development (Önerilen - Vector extension hatası varsa)
```bash
npx prisma db push
```
**Avantaj:** Shadow database kullanmaz, direkt schema'yı günceller  
**Dezavantaj:** Migration geçmişi kaydedilmez

#### Seçenek B: Production (Railway)
```bash
npx prisma migrate deploy
```
**Not:** Shadow database hatası alırsanız, Seçenek C'ye geçin.

#### Seçenek C: Manual SQL (Vector extension hatası varsa)
```bash
# Railway Production Database
psql -h nozomi.proxy.rlwy.net -p 23109 -U postgres -d railway \
  -f prisma/migrations/20250105120000_add_hybrid_seo_scores/migration.sql

# VEYA Local Database
psql -h localhost -U postgres -d backlink_bazaar \
  -f prisma/migrations/20250105120000_add_hybrid_seo_scores/migration.sql
```

**Kontrol:**
```sql
-- PostgreSQL'de kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Site'
  AND column_name IN ('s_tech', 's_sem', 's_link', 's_schema', 's_mon', 
                      's_eeat', 's_fresh', 's_viral', 's_ux', 's_global', 'seoFixes')
ORDER BY column_name;
```

**Beklenen:** 11 satır (10 skor + 1 seoFixes)

---

## 🟡 2. ENVIRONMENT VARIABLES EKLE (2 DAKİKA)

### Adım 2.1: `.env.local` Dosyasını Kontrol Et
```bash
# Dosya var mı kontrol et
ls -la .env.local

# Yoksa oluştur
touch .env.local
```

### Adım 2.2: Şu Satırları Ekle
```env
# Cloudflare Worker Configuration (Hybrid SEO Engine v2.0)
CF_WORKER_URL=https://seo-worker.snappost.com
CF_WORKER_API_KEY=optional_if_needed

# Local Audit Threshold (Opsiyonel - Default: 30)
# Eğer local audit score 30'dan düşükse, Phase 1 (DFS) atlanır
LOCAL_AUDIT_THRESHOLD=30
```

**Not:** 
- `CF_WORKER_URL` henüz hazır değilse, geçici olarak mock endpoint kullan:
  ```env
  CF_WORKER_URL=https://httpbin.org/post  # Mock endpoint (test için)
  ```
- Veya Phase 0 atlanabilir (non-blocking - Phase 1 devam eder)

### Adım 2.3: Environment Variables Kontrol Et
```bash
# Next.js dev server'ı restart et
npm run dev

# Veya production build
npm run build
```

**Kontrol:** Console'da `CF_WORKER_URL` hatası olmamalı.

---

## 🟡 3. LINTER HATALARINI KONTROL ET (3 DAKİKA)

### Adım 3.1: TypeScript Check
```bash
npx tsc --noEmit
```

**Beklenen:** Migration sonrası Prisma client type hataları düzelmiş olmalı.

### Adım 3.2: Build Check
```bash
npm run build
```

**Beklenen Hatalar (Geçici):**
- `Type 's_tech' does not exist` → Migration sonrası `npx prisma generate` ile düzelir
- `trafficData: null` → `undefined` olarak düzeltildi (satır 810)

**Çözüm:**
```bash
npx prisma generate
npm run build  # Tekrar dene
```

---

## 🟢 4. TEST SENARYOSU 1: HAPPY PATH (10 DAKİKA)

### Adım 4.1: Dashboard'a Git
1. `http://localhost:3000/agency/inventory/[id]` aç
2. Bir site seç (mevcut bir site - rawSeoData olan)

### Adım 4.2: SEO Metriklerini Yenile
1. "SEO Metriklerini Yenile" butonuna tıkla
2. Location seç (örn: `2840` - Türkiye)
3. Butona tıkla ve işlemin bitmesini bekle

**Beklenen:**
- ✅ Phase 0 (Local Audit) çalışmalı (CF Worker çağrısı)
- ✅ Console'da `--- LOCAL AUDIT: [url] ---` log mesajı görünmeli
- ✅ Phase 1 (DataForSEO) çalışmalı
- ✅ `rawSeoData[locationCode]['local_audit']` kaydedilmeli
- ✅ `rawSeoData[locationCode]['historical_rank_overview']` kaydedilmeli

### Adım 4.3: Veriyi Yeniden Analiz Et
1. "Veriyi Yeniden Analiz Et" butonuna tıkla
2. İşlemin bitmesini bekle (30-60 saniye)

**Beklenen:**
- ✅ 10 skor hesaplanmalı ve kaydedilmeli
- ✅ `s_tech`, `s_sem`, `s_link`, `s_schema`, `s_mon`, `s_eeat`, `s_fresh`, `s_viral`, `s_ux`, `s_global` DB'de görünmeli
- ✅ `seoFixes` listesi oluşturulmalı (en az 1-2 fix olmalı)
- ✅ HealthCheckPanel görünmeli (Radar Chart + Fix Listesi)
- ✅ Skor kartları renk kodlu görünmeli (yeşil/sarı/kırmızı)

### Adım 4.4: Database Kontrolü
```sql
-- Site'in yeni skorlarını kontrol et
SELECT 
  id, domain,
  s_tech, s_sem, s_link, s_schema, s_mon,
  s_eeat, s_fresh, s_viral, s_ux, s_global,
  jsonb_array_length(seoFixes) as fix_count
FROM "Site"
WHERE id = '[site-id]';
```

**Beklenen:**
- Tüm skorlar `NULL` değil (0-100 arası)
- `s_global` hesaplanmış olmalı (ağırlıklı ortalama)
- `fix_count >= 1` (en az 1 fix önerisi)

---

## 🟢 5. TEST SENARYOSU 2: LOCAL AUDIT FAILS (5 DAKİKA)

### Adım 5.1: CF Worker URL'i Geçici Olarak Yanlış Yap
`.env.local` dosyasında:
```env
CF_WORKER_URL=https://invalid-url.example.com
```

### Adım 5.2: Next.js Dev Server Restart
```bash
# Ctrl+C ile durdur
npm run dev  # Tekrar başlat
```

### Adım 5.3: Tekrar Test Et
1. "SEO Metriklerini Yenile" butonuna tıkla
2. Location seç ve işlemi başlat

**Beklenen:**
- ⚠️ Phase 0 hata vermeli AMA Phase 1 devam etmeli (non-blocking)
- ⚠️ Console'da hata mesajı görünmeli: `CF Worker API Error: ...`
- ✅ `rawSeoData[locationCode]['local_audit']` yok veya `null`
- ✅ `rawSeoData[locationCode]['historical_rank_overview']` kaydedilmeli (DFS devam etti)

### Adım 5.4: Veriyi Yeniden Analiz Et
1. "Veriyi Yeniden Analiz Et" butonuna tıkla

**Beklenen:**
- ✅ `s_tech`, `s_sem`, `s_schema`, `s_viral`, `s_ux`, `s_fresh` skorları 0 olmalı (CF Worker verisi yok)
- ✅ `s_link`, `s_mon`, `s_eeat` skorları hesaplanmalı (DFS verisi varsa)
- ✅ `s_global` hesaplanmalı (mevcut skorlardan ağırlıklı ortalama)

---

## 🔵 6. PRODUCTION DEPLOYMENT KONTROLÜ (5 DAKİKA)

### Adım 6.1: CF Worker Endpoint Hazır mı?
- [ ] CF Worker deployment yapıldı mı?
- [ ] Endpoint URL doğru mu? (`CF_WORKER_URL`)
- [ ] API key gerekiyorsa `.env.local`'de var mı?
- [ ] Worker endpoint test edildi mi? (Postman/curl)

**Test Command:**
```bash
curl -X POST https://seo-worker.snappost.com/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Beklenen:** `LocalAuditResponse` JSON response

### Adım 6.2: Railway Deployment (Eğer Gerekirse)
```bash
# Railway CLI ile deploy
railway up

# VEYA GitHub Actions ile otomatik deploy
# (Eğer CI/CD kuruluysa)
```

**Not:** Environment variables'ı Railway dashboard'dan da eklemen gerekebilir.

---

## 🐛 BİLİNEN SORUNLAR & ÇÖZÜMLER

### Sorun 1: Migration Shadow DB Hatası
**Hata:** `ERROR: extension "vector" is not available`  
**Çözüm:** 
- Seçenek A: `npx prisma db push` kullan (shadow DB kullanmaz)
- Seçenek C: Manual SQL migration çalıştır

### Sorun 2: Prisma Client Type Hataları
**Hata:** `Type 's_tech' does not exist in type ...`  
**Çözüm:** 
```bash
npx prisma generate
npm run build  # Tekrar dene
```

### Sorun 3: CF Worker URL Erişilemiyor
**Hata:** `CF Worker API Error: connect ECONNREFUSED`  
**Çözüm:** 
- Mock endpoint kullan: `CF_WORKER_URL=https://httpbin.org/post`
- Veya Phase 0 atlanabilir (non-blocking - Phase 1 devam eder)
- Local audit verisi yoksa, ilgili skorlar 0 olacak

### Sorun 4: Migration Sonrası Mevcut Veriler
**Durum:** Migration sonrası mevcut veriler korunmalı  
**Kontrol:**
```sql
SELECT COUNT(*) FROM "Site";
SELECT COUNT(*) FROM "Site" WHERE "rawSeoData" IS NOT NULL;
```

**Beklenen:** Mevcut veriler korunmalı, yeni skorlar `NULL` olmalı (reprocess gerekli)

---

## ✅ BAŞARI KRİTERLERİ

- [ ] Migration başarıyla çalıştırıldı (10 skor alanı + seoFixes eklendi)
- [ ] Environment variables eklendi (CF_WORKER_URL)
- [ ] Linter hataları yok (`npx tsc --noEmit` başarılı)
- [ ] Build başarılı (`npm run build` hatasız)
- [ ] Test Senaryo 1 başarılı (Happy Path - Phase 0 + Phase 1 + Reprocess)
- [ ] Test Senaryo 2 başarılı (Local Audit Fails - non-blocking)
- [ ] HealthCheckPanel görünüyor (Radar Chart + Fix Listesi)
- [ ] Database'de yeni skorlar kaydediliyor (10 skor + s_global + seoFixes)

---

## 📚 İLGİLİ DOSYALAR

- **Detaylı Durum:** `IMPLEMENTATION_STATUS.md`
- **Hızlı Başlangıç:** `QUICK_START_TOMORROW.md`
- **Kısa Rehber:** `YARIN_DEVAM_REHBERI.md`
- **Dev Update:** `dev_update.md`
- **Plan:** `HYBRID_SEO_ENGINE_V2_PLAN.md`
- **Migration SQL:** `prisma/migrations/20250105120000_add_hybrid_seo_scores/migration.sql`

---

## 🎯 ÖNCELİK SIRASI (KISA VERSİYON)

1. **Migration çalıştır** (5 dk) 🔴
2. **Environment variables ekle** (2 dk) 🟡
3. **Linter hatalarını kontrol et** (3 dk) 🟡
4. **Test Senaryo 1** (10 dk) 🟢
5. **Test Senaryo 2** (5 dk) 🟢
6. **Production deployment kontrolü** (5 dk) 🔵

**Toplam Tahmini Süre:** 30 dakika

---

**Son Güncelleme:** 2025-01-05  
**Hazırlayan:** AI Assistant  
**Durum:** ✅ Kayıtlar Tamamlandı - Migration Bekliyor

