import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Mock embedding function (OpenAI yerine basit bir hash-based vektör)
function generateMockEmbedding(text: string): number[] {
  // Basit bir hash-based vektör oluştur (1536 boyut)
  // Gerçek uygulamada OpenAI API kullanılacak
  const vector: number[] = [];
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let i = 0; i < 1536; i++) {
    const seed = (hash + i) % 1000;
    vector.push((Math.sin(seed) + 1) / 2); // 0-1 arası normalize
  }
  
  return vector;
}

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

    // Query'yi vektöre çevir
    const queryVector = generateMockEmbedding(query);

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
      include: {
        dna: {
          select: {
            topKeywords: true,
          },
        },
      },
    });

    // Similarity skorlarını ekle
    const sitesWithSimilarity = sites.map((site) => {
      const match = results.find((r) => r.siteId === site.id);
      return {
        ...site,
        similarity: match ? Number(match.similarity) : 0,
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
        include: {
          dna: {
            select: {
              topKeywords: true,
            },
          },
        },
        take: limit,
      });

      return NextResponse.json({
        success: true,
        data: sites.map((s) => ({ ...s, similarity: 0.5 })), // Fallback similarity
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

