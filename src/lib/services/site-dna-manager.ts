import 'server-only';
import prisma from '@/lib/prisma';
import { generateSiteDNAEmbedding, validateEmbedding } from './embedding-service';
import type { SiteInsights } from '@/lib/types/seo';

/**
 * SiteDNA Manager Service
 * 
 * Manages SiteDNA records for vector similarity search.
 * Handles CRUD operations and similarity search queries.
 */

/**
 * Create or update SiteDNA record for a site
 * 
 * Generates embedding from AI insights + SEO data and stores in SiteDNA.
 * If SiteDNA already exists, updates it; otherwise creates new record.
 * 
 * @param siteId - Site ID to create/update SiteDNA for
 * @param embedding - 1536-dimensional embedding vector (if pre-generated, otherwise will generate)
 * @param keywords - Array of top keywords (strings)
 * @param keywordsData - Full keyword data with metrics (JSON)
 * @param aiInsights - Gemini AI insights (SiteInsights object)
 * @returns Success status and message
 */
export async function createOrUpdateSiteDNA(
  siteId: string,
  embedding?: number[],
  keywords: string[] = [],
  keywordsData?: any,
  aiInsights?: SiteInsights | null
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate embedding if provided, otherwise we'll generate it
    if (embedding && !validateEmbedding(embedding)) {
      throw new Error('Invalid embedding vector (must be 1536 dimensions)');
    }

    // Convert embedding to PostgreSQL vector format string
    // Format: [0.1,0.2,0.3,...] as string
    let vectorString: string | null = null;
    if (embedding) {
      vectorString = `[${embedding.join(',')}]`;
    }

    // Use Prisma raw query to upsert SiteDNA (since vector type is Unsupported)
    // We use raw SQL because Prisma doesn't support vector type directly
    const vectorSql = vectorString 
      ? `vector = $2::vector(1536),` 
      : `vector = COALESCE($2::vector(1536), site_dna.vector),`;

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO site_dna (id, "siteId", vector, "topKeywords", keywords, "aiInsights", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        $1::text,
        $2::vector(1536),
        $3::text[],
        $4::jsonb,
        $5::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT ("siteId") 
      DO UPDATE SET
        ${vectorSql}
        "topKeywords" = $3::text[],
        keywords = $4::jsonb,
        "aiInsights" = $5::jsonb,
        "updatedAt" = NOW()
      `,
      siteId,
      vectorString || null,
      keywords.length > 0 ? keywords : [],
      keywordsData ? JSON.stringify(keywordsData) : null,
      aiInsights ? JSON.stringify(aiInsights) : null
    );

    console.log(`✅ [SITE_DNA] SiteDNA created/updated for siteId: ${siteId}`);
    return {
      success: true,
      message: 'SiteDNA kaydedildi',
    };
  } catch (error: any) {
    console.error('❌ [SITE_DNA] Error creating/updating SiteDNA:', error);
    return {
      success: false,
      message: error.message || 'SiteDNA kaydedilemedi',
    };
  }
}

/**
 * Generate and store SiteDNA from site data
 * 
 * Extracts data from site record, generates embedding, and stores in SiteDNA.
 * This is the main entry point for SiteDNA generation after SEO analysis.
 * 
 * @param siteId - Site ID
 * @param siteInsights - Gemini AI insights (optional, will call generateSiteInsights if not provided)
 * @param seoData - SEO data (scores, traffic, keywords) - optional, will extract from DB if not provided
 * @returns Success status
 */
export async function generateAndStoreSiteDNA(
  siteId: string,
  siteInsights?: SiteInsights | null,
  seoData?: {
    techScore?: number | null;
    globalScore?: number | null;
    trafficValue?: number | null;
    topKeywords?: string[] | any[];
    [key: string]: any;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🔍 [SITE_DNA] Generating SiteDNA for siteId: ${siteId}`);

    // If seoData not provided, extract from site record
    if (!seoData) {
      // Note: Prisma client types will be updated after migration and generate
      // Using raw query as fallback if types are not available
      const site = await prisma.site.findUnique({
        where: { id: siteId },
        select: {
          domain: true,
          // Score fields - will be available after Prisma client regeneration
          // @ts-expect-error - Prisma client types will be updated after migration
          s_tech: true,
          // @ts-expect-error
          s_sem: true,
          // @ts-expect-error
          s_link: true,
          // @ts-expect-error
          s_schema: true,
          // @ts-expect-error
          s_mon: true,
          // @ts-expect-error
          s_eeat: true,
          // @ts-expect-error
          s_fresh: true,
          // @ts-expect-error
          s_viral: true,
          // @ts-expect-error
          s_ux: true,
          // @ts-expect-error
          s_global: true,
          trafficData: true,
          rawSeoData: true,
        },
      });

      if (!site) {
        throw new Error('Site bulunamadı');
      }

      // Extract keywords from rawSeoData
      let topKeywords: string[] = [];
      let keywordsData: any = null;

      if (site.rawSeoData) {
        const rawData = site.rawSeoData as any;
        // Try to find ranked_keywords in any location
        for (const locationCode in rawData) {
          if (rawData[locationCode]?.ranked_keywords?.data?.tasks?.[0]?.result?.[0]?.items) {
            const items = rawData[locationCode].ranked_keywords.data.tasks[0].result[0].items;
            topKeywords = items
              .slice(0, 100) // Top 100 keywords
              .map((item: any) => item.keyword || item.se_keyword || String(item))
              .filter((kw: string) => typeof kw === 'string');
            keywordsData = items; // Full keyword data
            break;
          }
        }
      }

      // @ts-expect-error - Score fields available after Prisma client regeneration
      seoData = {
        techScore: site.s_tech ?? undefined,
        globalScore: site.s_global ?? undefined,
        trafficValue: (site.trafficData as any)?.estimatedTrafficValue ?? undefined,
        topKeywords: topKeywords,
        // @ts-expect-error
        s_sem: site.s_sem ?? undefined,
        // @ts-expect-error
        s_link: site.s_link ?? undefined,
        // @ts-expect-error
        s_schema: site.s_schema ?? undefined,
        // @ts-expect-error
        s_mon: site.s_mon ?? undefined,
        // @ts-expect-error
        s_eeat: site.s_eeat ?? undefined,
        // @ts-expect-error
        s_fresh: site.s_fresh ?? undefined,
        // @ts-expect-error
        s_viral: site.s_viral ?? undefined,
        // @ts-expect-error
        s_ux: site.s_ux ?? undefined,
      };
    }

    // If siteInsights not provided and we have Gemini AI available, generate it
    if (!siteInsights) {
      try {
        const { generateSiteInsights } = await import('./ai-manager');
        const site = await prisma.site.findUnique({
          where: { id: siteId },
          select: { domain: true },
        });
        
        if (site) {
          siteInsights = await generateSiteInsights(`https://${site.domain}`, seoData) || null;
          // If AI insights generation fails, continue with null (non-blocking)
        }
      } catch (error: any) {
        console.warn('⚠️ [SITE_DNA] AI insights generation failed, continuing without:', error.message);
        siteInsights = null;
      }
    }

    // Generate embedding from combined data (handle null/undefined)
    const embedding = await generateSiteDNAEmbedding(siteInsights || null, seoData);

    // Extract keywords array
    const keywords = seoData.topKeywords 
      ? seoData.topKeywords
          .slice(0, 1000) // Max 1000 keywords
          .map((kw: any) => typeof kw === 'string' ? kw : (kw.keyword || kw.se_keyword || String(kw)))
          .filter((kw: string) => typeof kw === 'string')
      : [];

    // Store in SiteDNA
    const result = await createOrUpdateSiteDNA(
      siteId,
      embedding,
      keywords,
      seoData.topKeywords, // Full keyword data as JSON
      siteInsights || null // Ensure null instead of undefined
    );

    console.log(`✅ [SITE_DNA] SiteDNA generation completed for siteId: ${siteId}`);
    return result;
  } catch (error: any) {
    console.error('❌ [SITE_DNA] Error generating SiteDNA:', error);
    return {
      success: false,
      message: error.message || 'SiteDNA oluşturulamadı',
    };
  }
}

/**
 * Find similar sites by SiteID
 * 
 * Uses vector similarity search to find sites similar to the given site.
 * 
 * @param siteId - Site ID to find similar sites for
 * @param limit - Maximum number of results (default: 10)
 * @param excludeSiteId - Whether to exclude the source site from results (default: true)
 * @returns Array of similar sites with similarity scores
 */
export async function findSimilarSites(
  siteId: string,
  limit: number = 10,
  excludeSiteId: boolean = true
): Promise<Array<{ site: any; similarity: number; dna: any }>> {
  try {
    // Get the site's embedding
    const siteDNA = await prisma.$queryRawUnsafe<Array<{
      vector: string;
      "siteId": string;
    }>>(
      `SELECT vector, "siteId" FROM site_dna WHERE "siteId" = $1::text AND vector IS NOT NULL`,
      siteId
    );

    if (!siteDNA || siteDNA.length === 0 || !siteDNA[0].vector) {
      console.warn(`⚠️ [SITE_DNA] No embedding found for siteId: ${siteId}`);
      return [];
    }

    const sourceVector = siteDNA[0].vector;

    // Find similar sites using cosine distance
    const results = await prisma.$queryRawUnsafe<Array<{
      id: string;
      "siteId": string;
      similarity: number;
    }>>(
      `
      SELECT 
        sd.id,
        sd."siteId",
        1 - (sd.vector <=> $1::vector) as similarity
      FROM site_dna sd
      WHERE sd.vector IS NOT NULL
        ${excludeSiteId ? `AND sd."siteId" != $2::text` : ''}
      ORDER BY sd.vector <=> $1::vector
      LIMIT ${excludeSiteId ? '$3' : '$2'}
      `,
      sourceVector,
      excludeSiteId ? siteId : limit,
      excludeSiteId ? limit : undefined
    );

    // Get site details
    const siteIds = results.map((r) => r.siteId);
    const sites = await prisma.site.findMany({
      where: {
        id: { in: siteIds },
      },
      // Note: dna relation will be available after Prisma client regeneration
      // For now, get dna data separately
    });

    // Get SiteDNA data separately (until Prisma client regenerated)
    const dnaData = await prisma.$queryRawUnsafe<Array<{
      "siteId": string;
      "topKeywords": string[];
      "aiInsights": any;
    }>>(
      `SELECT "siteId", "topKeywords", "aiInsights" FROM site_dna WHERE "siteId" = ANY($1::text[])`,
      siteIds
    );

    // Combine sites with similarity scores
    const sitesWithSimilarity = sites.map((site) => {
      const match = results.find((r) => r.siteId === site.id);
      const dna = dnaData.find((d) => d.siteId === site.id);
      return {
        site: site,
        similarity: match ? Number(match.similarity) : 0,
        dna: dna ? {
          topKeywords: dna.topKeywords,
          aiInsights: dna.aiInsights,
        } : null,
      };
    });

    // Sort by similarity (descending)
    sitesWithSimilarity.sort((a, b) => b.similarity - a.similarity);

    console.log(`✅ [SITE_DNA] Found ${sitesWithSimilarity.length} similar sites for siteId: ${siteId}`);
    return sitesWithSimilarity;
  } catch (error: any) {
    console.error('❌ [SITE_DNA] Error finding similar sites:', error);
    return [];
  }
}

/**
 * Find similar sites by query text
 * 
 * Generates embedding from query text, then finds similar sites.
 * 
 * @param queryText - Search query text (e.g., "technology blog about AI")
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of similar sites with similarity scores
 */
export async function findSimilarSitesByQuery(
  queryText: string,
  limit: number = 10
): Promise<Array<{ site: any; similarity: number; dna: any }>> {
  try {
    if (!queryText || typeof queryText !== 'string') {
      throw new Error('Query text is required');
    }

    // Generate embedding from query text
    const { generateEmbedding } = await import('./embedding-service');
    const queryEmbedding = await generateEmbedding(queryText);

    // Convert to PostgreSQL vector format
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Find similar sites using cosine distance
    const results = await prisma.$queryRawUnsafe<Array<{
      id: string;
      "siteId": string;
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

    // Get site details
    const siteIds = results.map((r) => r.siteId);
    const sites = await prisma.site.findMany({
      where: {
        id: { in: siteIds },
        status: 'verified', // Only verified sites
      },
      // Note: dna relation will be available after Prisma client regeneration
    });

    // Get SiteDNA data separately (until Prisma client regenerated)
    const dnaData = await prisma.$queryRawUnsafe<Array<{
      "siteId": string;
      "topKeywords": string[];
      "aiInsights": any;
    }>>(
      `SELECT "siteId", "topKeywords", "aiInsights" FROM site_dna WHERE "siteId" = ANY($1::text[])`,
      siteIds
    );

    // Combine sites with similarity scores
    const sitesWithSimilarity = sites.map((site) => {
      const match = results.find((r) => r.siteId === site.id);
      const dna = dnaData.find((d) => d.siteId === site.id);
      return {
        site: site,
        similarity: match ? Number(match.similarity) : 0,
        dna: dna ? {
          topKeywords: dna.topKeywords,
          aiInsights: dna.aiInsights,
        } : null,
      };
    });

    // Sort by similarity (descending)
    sitesWithSimilarity.sort((a, b) => b.similarity - a.similarity);

    console.log(`✅ [SITE_DNA] Found ${sitesWithSimilarity.length} similar sites for query: "${queryText}"`);
    return sitesWithSimilarity;
  } catch (error: any) {
    console.error('❌ [SITE_DNA] Error finding similar sites by query:', error);
    return [];
  }
}

