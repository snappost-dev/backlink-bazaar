import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateEmbedding } from '@/lib/services/embedding-service';

// POST: Vector search ile site arama
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 10 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Query text is required',
        },
        { status: 400 }
      );
    }

    // Query'yi vektöre çevir (real embedding service)
    const queryVector = await generateEmbedding(query);

    // pgvector ile cosine similarity araması
    // Prisma raw query kullanarak vector search yapıyoruz
    const vectorString = `[${queryVector.join(',')}]`;

    // Raw SQL query ile cosine similarity hesapla
    const results = await prisma.$queryRawUnsafe<Array<{
      id: string;
      siteId: string;
      similarity: number;
    }>>(
      `
      SELECT 
        sd.id,
        sd."siteId",
        1 - (sd.vector <=> $1::vector) as similarity
      FROM site_dna sd
      WHERE sd.vector IS NOT NULL
      ORDER BY sd.vector <=> $1::vector
      LIMIT $2
      `,
      vectorString,
      limit
    );

    // Site bilgilerini getir
    const siteIds = results.map((r) => r.siteId);
    const sites = await prisma.site.findMany({
      where: {
        id: { in: siteIds },
        status: 'verified',
      },
      // Note: dna relation will be available after Prisma client regeneration
      // For now, we'll get dna data separately if needed
    });

    // Get SiteDNA data separately (raw query until Prisma client regenerated)
    const dnaData = await prisma.$queryRawUnsafe<Array<{
      "siteId": string;
      "topKeywords": string[];
    }>>(
      `SELECT "siteId", "topKeywords" FROM site_dna WHERE "siteId" = ANY($1::text[])`,
      siteIds
    );

    // Similarity skorlarını ekle
    const sitesWithSimilarity = sites.map((site) => {
      const match = results.find((r) => r.siteId === site.id);
      const dna = dnaData.find((d) => d.siteId === site.id);
      return {
        ...site,
        similarity: match ? Number(match.similarity) : 0,
        dna: dna ? { topKeywords: dna.topKeywords } : null,
      };
    });

    // Similarity'ye göre sırala
    sitesWithSimilarity.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    return NextResponse.json({
      success: true,
      data: sitesWithSimilarity,
      query: query,
      count: sitesWithSimilarity.length,
    });
  } catch (error: any) {
    console.error('Error searching sites:', error);
    
    // Eğer vector search başarısız olursa, basit text search yap
    try {
      const body = await request.json();
      const { query, limit = 10 } = body;

      const sites = await prisma.site.findMany({
        where: {
          status: 'verified',
          OR: [
            { domain: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
      });

      // Get SiteDNA data separately if sites found
      const fallbackSiteIds = sites.map((s) => s.id);
      const fallbackDnaData = fallbackSiteIds.length > 0 
        ? await prisma.$queryRawUnsafe<Array<{
            "siteId": string;
            "topKeywords": string[];
          }>>(
            `SELECT "siteId", "topKeywords" FROM site_dna WHERE "siteId" = ANY($1::text[])`,
            fallbackSiteIds
          )
        : [];

      return NextResponse.json({
        success: true,
        data: sites.map((s) => {
          const dna = fallbackDnaData.find((d) => d.siteId === s.id);
          return { 
            ...s, 
            similarity: 0.5, // Fallback similarity
            dna: dna ? { topKeywords: dna.topKeywords } : null,
          };
        }),
        query: query,
        count: sites.length,
        fallback: true,
      });
    } catch (fallbackError: any) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to search sites',
        },
        { status: 500 }
      );
    }
  }
}

