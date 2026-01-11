# BACKLINK BAZAAR (EXCHANGE) - PROJECT BLUEPRINT
**Public URL:** exchange.snappost.app
**Reference:** Snappost Master Bundle v5.6 & Architecture Docs

## 1. MİMARİ VİZYON (Architecture)
Bu proje, Snappost ekosisteminin "Borsa" ayağıdır. Alıcı (Buyer), Ajans (Agency) ve Yayıncı (Publisher) tek bir çatı altında toplanır.
- **Teknik Altyapı:** Next.js 16 (App Router), React 19, Tailwind CSS, Prisma (PostgreSQL).
- [cite_start]**Yönlendirme:** `src/middleware.ts` kullanılarak subdomain (ajans.snappost.app) tabanlı Whitelabel yönlendirmesi yapılır[cite: 62, 182].

## [cite_start]2. TASARIM SİSTEMİ (Design System) [cite: 94-103, 144]
Snappost görsel kimliği birebir uygulanmalıdır:
- **Renkler:** Slate (Zemin/Nötr), Indigo (Marka/Ajans), Blue (Yayıncı), Red (Admin).
- **Radius:** Agresif yuvarlak köşeler (`rounded-[2.5rem]` ve `rounded-[3rem]`) standarttır.
- **Tipografi:** Başlıklar `uppercase tracking-tight font-black` stilindedir.
- **İkonlar:** `lucide-react` kullanılacaktır.

## [cite_start]3. KLASÖR YAPISI (The Map) [cite: 39-50]
Proje "Role-Based Layout" prensibine göre klasörlenmelidir:
- `src/app/(marketing)/`: Landing page ve genel sayfalar.
- `src/app/(auth)/`: Login, Register (URL'de gözükmez).
- `src/app/(dashboard)/layout.tsx`: Ortak Sidebar ve Header'ın bulunduğu ana katman.
- [cite_start]`src/app/(dashboard)/publisher/`: Envanter, Cüzdan, Doğrulama Hub [cite: 41-42].
- [cite_start]`src/app/(dashboard)/agency/`: Vetting Pool, Workroom, Whitelabel Ayarları [cite: 43-45].
- [cite_start]`src/app/(dashboard)/buyer/`: Marketplace, Siparişler (Branded Interface) [cite: 45-46].

## 4. VERİ VE GÜVENLİK KURALLARI (Gary's Protocols)
- [cite_start]**Immutable ID:** Tüm tablolarda (User, Site, Order) mutlaka `uuid` (v4) kullanılmalıdır[cite: 286].
- [cite_start]**Fiyat Maskeleme:** Alıcı API isteklerinde asla `base_price` (ham fiyat) dönmemeli, sadece komisyonlu `final_price` dönmelidir[cite: 183, 206].
- [cite_start]**Snapshot History:** Ajans bir siteyi analiz ettiğinde, veriler `ScoutingHistory` tablosuna JSON snapshot olarak kaydedilmelidir[cite: 267, 305].
- [cite_start]**Kademeli Şeffaflık:** Yayıncılar, ajansın kâr marjını değil, sadece ortalama satış fiyatını görebilir[cite: 8, 235].

## 5. ÖZEL MODÜLLER
- [cite_start]**The Briefcase:** Sipariş anında metin, veri ve talimatların paketlendiği JSON yapısı[cite: 160].
- [cite_start]**Universal Snippet:** Yayıncı sitelerine eklenen PHP/JS doğrulama kodu[cite: 125].