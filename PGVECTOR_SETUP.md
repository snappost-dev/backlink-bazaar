# pgvector Extension Setup Guide

## Özet

pgvector extension aktif edildi ve SiteDNA modeli hazır. Ancak **vector extension'ın PostgreSQL veritabanında yüklü olması gerekiyor**.

## Durum

✅ **Kod hazır**: Tüm implementation tamamlandı
- Embedding service oluşturuldu
- SiteDNA manager oluşturuldu  
- SEO manager'a entegre edildi
- Vector search route güncellendi

⚠️ **Migration beklemede**: Vector extension veritabanında yüklü değil

## pgvector Extension Kurulumu

### Railway/Cloud PostgreSQL

Railway'de pgvector extension'ı enable etmek için:

1. Railway Dashboard'a git
2. PostgreSQL servisine git
3. Extensions sekmesine bak veya
4. Railway CLI ile:
   ```bash
   railway run psql -c "CREATE EXTENSION IF NOT EXISTS vector;"
   ```

Eğer Railway'de extension desteği yoksa, Railway support'a başvur veya alternatif olarak:

- Local PostgreSQL kullan (development)
- Veya pgvector desteği olan başka bir PostgreSQL provider kullan

### Local PostgreSQL (Development)

```bash
# macOS (Homebrew)
brew install pgvector

# Ubuntu/Debian
apt-get install postgresql-17-pgvector

# veya source'dan kurulum
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector
make
make install
```

Sonra extension'ı enable et:
```bash
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Manual Migration SQL

Extension yüklendikten sonra, manuel olarak çalıştır:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
```

Migration dosyası: `prisma/migrations/99999999999999_enable_vector_extension/migration.sql`

## Migration Adımları

### Adım 1: pgvector Extension'ı Yükle

Yukarıdaki kurulum adımlarını takip et.

### Adım 2: Extension'ı Verify Et

```bash
psql -d your_database -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### Adım 3: Prisma Schema'yı Push Et

```bash
cd /home/aurora/backlink-bazaar
npx prisma db push --accept-data-loss
```

### Adım 4: Prisma Client'ı Generate Et

```bash
npx prisma generate
```

### Adım 5: Test Et

```bash
# Embedding generation test
npm run dev

# Vector search test
curl -X POST http://localhost:3000/api/sites/search \
  -H "Content-Type: application/json" \
  -d '{"query": "technology blog", "limit": 10}'
```

## Troubleshooting

### Hata: "extension vector is not available"

**Çözüm**: pgvector extension'ı PostgreSQL server'da yüklü değil. Yukarıdaki kurulum adımlarını takip et.

### Hata: "The shadow database you configured appears to be the same as the main database"

**Çözüm**: Shadow database disabled edildi. `prisma db push` kullan (migrate dev değil).

### Hata: "dna does not exist in type SiteInclude"

**Çözüm**: Prisma client generate edilmemiş. `npx prisma generate` çalıştır.

### Hata: "Cannot find module 'openai'"

**Çözüm**: OpenAI embedding opsiyonel. Eğer OpenAI kullanmak istiyorsan:
```bash
npm install openai
```

OpenAI olmadan da çalışır (hash-based fallback kullanır).

## Embedding Generation Strategy

### Öncelik Sırası

1. **OpenAI** (eğer `OPENAI_API_KEY` varsa)
   - Model: `text-embedding-3-large` (1536 dimensions)
   - En iyi sonuç

2. **Hash-based Fallback** (varsayılan)
   - OpenAI yoksa otomatik kullanılır
   - Daha az semantik ama çalışır

### OpenAI API Key (Opsiyonel)

`.env.local` dosyasına ekle:

```env
# OpenAI Embedding API (Optional - fallback method available)
OPENAI_API_KEY=sk-...
```

**Not**: OpenAI olmadan da çalışır. Hash-based method kullanılır.

## SiteDNA Generation Flow

```
reprocessSeoData() / analyzeSite()
  │
  ├─ Phase 0: Local Audit (CF Worker)
  ├─ Phase 1: DataForSEO APIs
  ├─ Phase 2: Reprocess (10 scores)
  │
  ├─ generateSiteInsights() [Gemini AI - Optional]
  │   └─ Returns: SiteInsights (category, summary, risk, price, pros, cons)
  │
  └─ generateAndStoreSiteDNA() [Phase 3]
      │
      ├─ Extract: keywords, scores, insights, traffic value
      ├─ Generate embedding (OpenAI or fallback)
      │   └─ Input: { insights: SiteInsights, seoData: {...}, keywords: [...] }
      │   └─ Output: 1536-dim vector
      │
      └─ Store in SiteDNA
          ├─ vector: embedding
          ├─ topKeywords: extracted keywords (top 1000)
          ├─ keywords: full keyword data (JSON)
          └─ aiInsights: SiteInsights (JSON)
```

## Test Checklist

- [ ] pgvector extension yüklü ve aktif
- [ ] `npx prisma db push` başarılı
- [ ] `npx prisma generate` başarılı
- [ ] Embedding generation test edildi
- [ ] SiteDNA creation test edildi
- [ ] Similarity search test edildi
- [ ] "Find similar sites" çalışıyor

## Next Steps

1. **pgvector Extension Yükle**: Railway/local PostgreSQL'e yükle
2. **Migration Çalıştır**: `npx prisma db push`
3. **Client Generate**: `npx prisma generate`
4. **Test Et**: Embedding generation ve similarity search test et
5. **Production Deploy**: Extension'ı production DB'de enable et

## Kaynaklar

- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [pgvector Installation Guide](https://github.com/pgvector/pgvector#installation)
- [Railway PostgreSQL Extensions](https://docs.railway.app/databases/postgresql)

