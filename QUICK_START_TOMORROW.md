# 🚀 YARIN DEVAM ET - HIZLI BAŞLANGIÇ REHBERİ

**Tarih:** 2025-01-05  
**Durum:** ✅ Implementation Tamamlandı - Migration Bekliyor  
**Tahmini Süre:** 15-30 dakika

---

## 📋 ADIM 1: MIGRATION ÇALIŞTIR (KRİTİK - 5 DAKİKA)

### Seçenek A: Development (Önerilen)
```bash
cd /home/aurora/backlink-bazaar
npx prisma db push
```

### Seçenek B: Production (Railway)
```bash
cd /home/aurora/backlink-bazaar
npx prisma migrate deploy
```

### Seçenek C: Manual SQL (Vector extension hatası varsa)
```bash
# Migration dosyasını doğrudan çalıştır
psql -h <host> -U <user> -d <database> \
  -f prisma/migrations/20250105120000_add_hybrid_seo_scores/migration.sql
```

**Kontrol:**
```bash
npx prisma generate
# Hata yoksa ✓ Migration başarılı
```

---

## 📋 ADIM 2: ENVIRONMENT VARIABLES EKLE (2 DAKİKA)

`.env.local` dosyasına şunları ekle:

```env
# Cloudflare Worker Configuration
CF_WORKER_URL=https://seo-worker.snappost.com
CF_WORKER_API_KEY=optional_if_needed

# Local Audit Threshold (Opsiyonel - Default: 30)
LOCAL_AUDIT_THRESHOLD=30
```

**Not:** `CF_WORKER_URL` henüz hazır değilse, geçici olarak şunu kullan:
```env
CF_WORKER_URL=https://httpbin.org/post  # Mock endpoint (test için)
```

---

## 📋 ADIM 3: LINTER HATALARINI KONTROL ET (3 DAKİKA)

```bash
cd /home/aurora/backlink-bazaar
npm run build
# veya
npx tsc --noEmit
```

**Beklenen:** Migration sonrası Prisma client type hataları düzelmiş olmalı.

**Eğer hata varsa:**
- `npx prisma generate` tekrar çalıştır
- `src/lib/services/seo-manager.ts` satır 810'u kontrol et (`trafficData: undefined`)

---

## 📋 ADIM 4: TEST SENARYOSU 1 - HAPPY PATH (10 DAKİKA)

### 4.1. Bir Site Seç
1. Dashboard'a git: `/agency/inventory/[id]`
2. Bir site seç (mevcut bir site)

### 4.2. SEO Metriklerini Yenile
1. "SEO Metriklerini Yenile" butonuna tıkla
2. Location seç (örn: `2840` - Türkiye)
3. Butona tıkla ve işlemin bitmesini bekle

**Beklenen:**
- Phase 0 (Local Audit) çalışmalı (CF Worker çağrısı)
- Phase 1 (DataForSEO) çalışmalı
- `rawSeoData[locationCode]['local_audit']` kaydedilmeli
- Console'da log mesajları görünmeli

### 4.3. Veriyi Yeniden Analiz Et
1. "Veriyi Yeniden Analiz Et" butonuna tıkla
2. İşlemin bitmesini bekle

**Beklenen:**
- 10 skor hesaplanmalı ve kaydedilmeli
- HealthCheckPanel görünmeli (Radar Chart + Fix Listesi)
- Skor kartları renk kodlu görünmeli

---

## 📋 ADIM 5: TEST SENARYOSU 2 - LOCAL AUDIT FAILS (5 DAKİKA)

### 5.1. CF Worker URL'i Geçici Olarak Yanlış Yap
`.env.local` dosyasında:
```env
CF_WORKER_URL=https://invalid-url.example.com
```

### 5.2. Tekrar Test Et
1. "SEO Metriklerini Yenile" butonuna tıkla
2. Location seç ve işlemi başlat

**Beklenen:**
- Phase 0 hata vermeli AMA Phase 1 devam etmeli (non-blocking)
- Console'da hata mesajı görünmeli
- `s_tech`, `s_sem`, `s_schema`, `s_viral`, `s_ux`, `s_fresh` skorları 0 olmalı
- `s_link`, `s_mon`, `s_eeat` skorları hesaplanmalı (DFS verisi varsa)

---

## 📋 ADIM 6: PRODUCTION DEPLOYMENT KONTROLÜ (5 DAKİKA)

### 6.1. CF Worker Endpoint Hazır mı?
- [ ] CF Worker deployment yapıldı mı?
- [ ] Endpoint URL doğru mu? (`CF_WORKER_URL`)
- [ ] API key gerekiyorsa `.env.local`'de var mı?

### 6.2. Railway Deployment (Eğer Gerekirse)
```bash
# Railway CLI ile deploy
railway up

# veya GitHub Actions ile otomatik deploy
# (Eğer CI/CD kuruluysa)
```

---

## 🐛 BİLİNEN SORUNLAR & ÇÖZÜMLER

### Sorun 1: Migration Shadow DB Hatası
**Hata:** `ERROR: extension "vector" is not available`  
**Çözüm:** `npx prisma db push` kullan (Seçenek A) veya manual SQL (Seçenek C)

### Sorun 2: Prisma Client Type Hataları
**Hata:** `Type 's_tech' does not exist in type ...`  
**Çözüm:** 
```bash
npx prisma generate
```

### Sorun 3: CF Worker URL Erişilemiyor
**Hata:** `CF Worker API Error: connect ECONNREFUSED`  
**Çözüm:** 
- Mock endpoint kullan: `CF_WORKER_URL=https://httpbin.org/post`
- Veya Phase 0 atlanabilir (non-blocking - Phase 1 devam eder)

---

## ✅ BAŞARI KRİTERLERİ

1. ✅ Migration başarıyla çalıştırıldı (10 skor alanı + seoFixes eklendi)
2. ✅ Environment variables eklendi (CF_WORKER_URL)
3. ✅ Linter hataları yok
4. ✅ Test Senaryo 1 başarılı (Happy Path)
5. ✅ Test Senaryo 2 başarılı (Local Audit Fails - non-blocking)
6. ✅ HealthCheckPanel görünüyor (Radar Chart + Fix Listesi)

---

## 📚 İLGİLİ DOSYALAR

- **Detaylı Durum:** `IMPLEMENTATION_STATUS.md`
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
**Durum:** ✅ Kayıtlar Tamamlandı - Yarın Devam Edilebilir

