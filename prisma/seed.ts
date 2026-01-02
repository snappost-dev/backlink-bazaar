import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Prisma 7: Use adapter for direct database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - for clean seed)
  console.log('🧹 Cleaning existing data...');
  await prisma.order.deleteMany();
  await prisma.scoutingHistory.deleteMany();
  await prisma.siteDNA.deleteMany();
  await prisma.site.deleteMany();
  await prisma.valuationRule.deleteMany();
  await prisma.user.deleteMany();

  // 1. ADMIN USER
  console.log('👤 Creating Admin user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@snappost.app',
      name: 'System Administrator',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // 2. AGENCY USER
  console.log('👤 Creating Agency user...');
  const agency = await prisma.user.create({
    data: {
      email: 'agency@blue-seo.com',
      name: 'Blue SEO Agency',
      role: 'AGENCY',
    },
  });
  console.log(`✅ Agency created: ${agency.email}`);

  // 3. PUBLISHER USER
  console.log('👤 Creating Publisher user...');
  const publisher = await prisma.user.create({
    data: {
      email: 'pub@otohaber.com',
      name: 'Oto Haber Publisher',
      role: 'PUBLISHER',
    },
  });
  console.log(`✅ Publisher created: ${publisher.email}`);

  // 4. BUYER USER
  console.log('👤 Creating Buyer user...');
  const buyer = await prisma.user.create({
    data: {
      email: 'client@brand.com',
      name: 'Brand Corp Client',
      role: 'BUYER',
    },
  });
  console.log(`✅ Buyer created: ${buyer.email}`);

  // 5. PUBLISHER'S SITE (otohaber.com)
  console.log('🌐 Creating Publisher site...');
  const site = await prisma.site.create({
    data: {
      domain: 'otohaber.com',
      status: 'verified',
      category: 'Automotive',
      basePrice: 120.0,
      finalPrice: 150.0,
      metrics: {
        da: 42,
        dr: 35,
        spam: 1,
      },
      traffic: {
        monthly: 15000,
        organic: 12000,
        referral: 3000,
      },
      verifiedAt: new Date('2024-01-15'),
      publisherId: publisher.id,
    },
  });
  console.log(`✅ Site created: ${site.domain}`);

  // 6. SITE DNA (Vector data - mock)
  console.log('🧬 Creating SiteDNA...');
  await prisma.siteDNA.create({
    data: {
      siteId: site.id,
      topKeywords: [
        'otomobil haberleri',
        'araç testleri',
        'yeni model',
        'elektrikli araba',
        'otomatik vites',
      ],
      keywords: [
        { keyword: 'otomobil haberleri', clicks: 1200, impressions: 15000 },
        { keyword: 'araç testleri', clicks: 800, impressions: 12000 },
        { keyword: 'yeni model', clicks: 600, impressions: 10000 },
      ],
    },
  });
  console.log('✅ SiteDNA created');

  // 7. SCOUTING HISTORY (Snapshot)
  console.log('📸 Creating ScoutingHistory snapshot...');
  await prisma.scoutingHistory.create({
    data: {
      siteId: site.id,
      agencyId: agency.id,
      snapshotData: {
        metrics: { da: 42, dr: 35, spam: 1 },
        traffic: { monthly: 15000, organic: 12000, referral: 3000 },
        pricing: { basePrice: 120.0, finalPrice: 150.0 },
        status: 'verified',
      },
      diffSummary: 'Initial snapshot - Site verified and active',
    },
  });
  console.log('✅ ScoutingHistory snapshot created');

  // 8. ORDER (The Briefcase)
  console.log('📦 Creating Order...');
  await prisma.order.create({
    data: {
      siteId: site.id,
      buyerId: buyer.id,
      status: 'in_progress',
      price: 150.0,
      finalPrice: 180.0,
      draftBrief: {
        readyText: 'Oto Haber sitesinde yayınlanacak içerik metni...',
        rawData: null,
        aiInstruction: 'Teknoloji odaklı, 500 kelimelik bir blog yazısı oluştur.',
        targetUrl: 'https://brand.com/products',
        anchorText: 'En İyi Otomobil Aksesuarları',
        deadline: '2024-03-20',
        placement: 'content',
      },
      approvedBrief: {
        readyText: 'Oto Haber sitesinde yayınlanacak içerik metni...',
        rawData: null,
        aiInstruction: 'Teknoloji odaklı, 500 kelimelik bir blog yazısı oluştur.',
        targetUrl: 'https://brand.com/products',
        anchorText: 'En İyi Otomobil Aksesuarları',
        deadline: '2024-03-20',
        placement: 'content',
      },
      briefStatus: 'APPROVED',
      deadline: new Date('2024-03-20'),
    },
  });
  console.log('✅ Order created');

  // 9. VALUATION RULE
  console.log('💰 Creating ValuationRule...');
  await prisma.valuationRule.create({
    data: {
      minDoz: 30,
      trafficMultiplier: 1.2,
      baseFloor: 50.0,
      categoryMultipliers: {
        Technology: 1.1,
        Health: 1.3,
        Finance: 1.5,
        Automotive: 1.2,
      },
      isActive: true,
    },
  });
  console.log('✅ ValuationRule created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: 4 (Admin, Agency, Publisher, Buyer)`);
  console.log(`   - Sites: 1 (otohaber.com)`);
  console.log(`   - Orders: 1`);
  console.log(`   - Snapshots: 1`);
  console.log(`   - Valuation Rules: 1`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
