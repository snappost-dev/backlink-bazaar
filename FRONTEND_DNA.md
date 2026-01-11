# BACKLINK BAZAAR - FRONTEND DNA
**Source Code:** Snappost Master Bundle v5.6 (React 19)

## 1. UI FELSEFESİ: FRONTEND-FIRST
Biz Backend API'ların bitmesini beklemiyoruz. [cite_start]Arayüzü "Mock Data" ile hemen ayağa kaldırıyoruz.
- [cite_start]**Mock Data:** `MOCK_SITES`, `TRAFFIC_DATA` gibi sabit verilerle UI dolu gelmeli [cite: 96-98].
- [cite_start]**Role-Based View:** Tek bir dashboard layout'u, `currentRole` (PUBLISHER, AGENCY, BUYER) durumuna göre renk ve menü değiştirir [cite: 143-154].

## 2. GÖRSEL BİLEŞENLER (COMPONENTS)
Aşağıdaki bileşen mantıkları birebir uygulanmalıdır:

### [cite_start]A. Renk ve Tema Mantığı [cite: 99-102]
- **Publisher:** Blue (`bg-blue-600`) - Odak: Envanter, Para.
- **Agency:** Indigo (`bg-indigo-600`) - Odak: Analiz, Vetting.
- **Buyer:** Slate/Black (`bg-slate-900`) - Odak: Alışveriş.
- **Admin:** Red (`bg-red-600`) - Odak: Denetim.

### [cite_start]B. Sidebar Yapısı (Navigation) [cite: 144-149]
Sidebar statik değildir. `ROLE_CONFIGS` objesinden beslenir.
```tsx
const ROLE_CONFIGS = {
  PUBLISHER: { color: "blue", menu: [{id: 'inventory', icon: Globe}, ...] },
  AGENCY: { color: "indigo", menu: [{id: 'vetting', icon: Database}, ...] },
  ...
}