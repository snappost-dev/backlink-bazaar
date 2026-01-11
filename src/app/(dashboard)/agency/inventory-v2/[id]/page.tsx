import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatDomain } from "@/lib/utils";
import Link from "next/link";
import { InventoryV2Client } from "./InventoryV2Client";
import { findSimilarSites } from "@/lib/services/site-dna-manager";
import type { LocalAuditResponse, SiteInsights, SeoFix, RawSeoDataMultiRegion } from "@/lib/types/seo";

export const dynamic = 'force-dynamic';

/**
 * Parse Phase 0 Data (CF Worker - local_audit)
 */
function parsePhase0Data(rawSeoData: any, locationCode: number | null): {
  localAudit: LocalAuditResponse | null;
  s_tech: number | null;
  s_schema: number | null;
  s_ux: number | null;
  quickFixes: SeoFix[];
} {
  if (!rawSeoData || typeof rawSeoData !== 'object') {
    return {
      localAudit: null,
      s_tech: null,
      s_schema: null,
      s_ux: null,
      quickFixes: [],
    };
  }

  // Try to find local_audit in the specified location
  const locationKey = locationCode ? String(locationCode) : Object.keys(rawSeoData)[0];
  const locationData = rawSeoData[locationKey];
  
  if (!locationData || typeof locationData !== 'object') {
    return {
      localAudit: null,
      s_tech: null,
      s_schema: null,
      s_ux: null,
      quickFixes: [],
    };
  }

  const localAudit = locationData.local_audit?.data as LocalAuditResponse | null;

  if (!localAudit) {
    return {
      localAudit: null,
      s_tech: null,
      s_schema: null,
      s_ux: null,
      quickFixes: [],
    };
  }

  // Extract quick fixes from local audit
  const quickFixes: SeoFix[] = [];
  
  // Check for critical issues
  if (!localAudit.meta?.title) {
    quickFixes.push({
      code: 'NO_TITLE',
      priority: 'HIGH',
      message: 'Meta title eksik',
      category: 'TECHNICAL',
      scoreImpact: 10,
    });
  }
  
  if (!localAudit.meta?.description) {
    quickFixes.push({
      code: 'NO_DESCRIPTION',
      priority: 'HIGH',
      message: 'Meta description eksik',
      category: 'TECHNICAL',
      scoreImpact: 8,
    });
  }
  
  if (!localAudit.meta?.h1) {
    quickFixes.push({
      code: 'NO_H1',
      priority: 'HIGH',
      message: 'H1 etiketi eksik',
      category: 'SEMANTIC',
      scoreImpact: 10,
    });
  }
  
  if (!localAudit.technical?.ssl) {
    quickFixes.push({
      code: 'NO_SSL',
      priority: 'HIGH',
      message: 'SSL sertifikası eksik',
      category: 'TECHNICAL',
      scoreImpact: 15,
    });
  }
  
  if (!localAudit.schema?.jsonLd) {
    quickFixes.push({
      code: 'NO_SCHEMA',
      priority: 'MEDIUM',
      message: 'Schema markup eksik',
      category: 'SCHEMA',
      scoreImpact: 5,
    });
  }

  // Calculate quick scores from local audit (simplified)
  let s_tech = 100;
  if (!localAudit.technical?.ssl) s_tech -= 15;
  if (!localAudit.meta?.title) s_tech -= 10;
  if (!localAudit.meta?.description) s_tech -= 8;
  if (!localAudit.meta?.h1) s_tech -= 10;
  if (localAudit.links?.broken && localAudit.links.broken > 0) s_tech -= 5;
  s_tech = Math.max(0, s_tech);

  let s_schema = localAudit.schema?.jsonLd ? 100 : 0;
  if (localAudit.schema?.jsonLdErrors && localAudit.schema.jsonLdErrors.length > 0) {
    s_schema = Math.max(0, 100 - (localAudit.schema.jsonLdErrors.length * 10));
  }

  let s_ux = 100;
  if (localAudit.performance?.lcp && localAudit.performance.lcp > 2500) s_ux -= 20;
  if (localAudit.performance?.ttfb && localAudit.performance.ttfb > 800) s_ux -= 15;
  s_ux = Math.max(0, s_ux);

  return {
    localAudit,
    s_tech: s_tech || null,
    s_schema: s_schema || null,
    s_ux: s_ux || null,
    quickFixes,
  };
}

/**
 * Parse Phase 1 Data (DataForSEO - 7 APIs)
 */
function parsePhase1Data(rawSeoData: any, locationCode: number | null): {
  isAvailable: boolean;
  rankedKeywords: any[] | null;
  serpCompetitors: any[] | null;
  relevantPages: any[] | null;
  backlinkSummary: any | null;
  domainIntersection: any | null;
  backlinkHistory: any | null;
  historicalRank: any | null;
} {
  if (!rawSeoData || typeof rawSeoData !== 'object') {
    return {
      isAvailable: false,
      rankedKeywords: null,
      serpCompetitors: null,
      relevantPages: null,
      backlinkSummary: null,
      domainIntersection: null,
      backlinkHistory: null,
      historicalRank: null,
    };
  }

  const locationKey = locationCode ? String(locationCode) : Object.keys(rawSeoData)[0];
  const locationData = rawSeoData[locationKey];
  
  if (!locationData || typeof locationData !== 'object') {
    return {
      isAvailable: false,
      rankedKeywords: null,
      serpCompetitors: null,
      relevantPages: null,
      backlinkSummary: null,
      domainIntersection: null,
      backlinkHistory: null,
      historicalRank: null,
    };
  }

  // Check if Phase 1 is available (if any DataForSEO API data exists)
  const isAvailable = !!(
    locationData.ranked_keywords ||
    locationData.serp_competitors ||
    locationData.relevant_pages ||
    locationData.backlink_summary ||
    locationData.domain_intersection ||
    locationData.backlink_history ||
    locationData.historical_rank_overview
  );

  // Extract data from each API
  const rankedKeywords = locationData.ranked_keywords?.data?.tasks?.[0]?.result?.[0]?.items || null;
  const serpCompetitors = locationData.serp_competitors?.data?.tasks?.[0]?.result?.[0]?.items || null;
  const relevantPages = locationData.relevant_pages?.data?.tasks?.[0]?.result?.[0]?.items || null;
  const backlinkSummary = locationData.backlink_summary?.data?.tasks?.[0]?.result?.[0] || null;
  const domainIntersection = locationData.domain_intersection?.data?.tasks?.[0]?.result?.[0] || null;
  const backlinkHistory = locationData.backlink_history?.data?.tasks?.[0]?.result?.[0] || null;
  const historicalRank = locationData.historical_rank_overview?.data?.tasks?.[0]?.result?.[0] || null;

  return {
    isAvailable,
    rankedKeywords,
    serpCompetitors,
    relevantPages,
    backlinkSummary,
    domainIntersection,
    backlinkHistory,
    historicalRank,
  };
}

export default async function InventoryV2Page({ params }: { params: { id: string } }) {
  const siteId = params.id;

  // Fetch site with all required fields
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      domain: true,
      basePrice: true,
      finalPrice: true,
      status: true,
      category: true,
      verificationStatus: true,
      createdAt: true,
      rawSeoData: true,
      snappostScore: true,
      trafficData: true,
      lastSeoCheck: true,
      // 10-Dimensional Scores
      s_tech: true,
      s_sem: true,
      s_link: true,
      s_schema: true,
      s_mon: true,
      s_eeat: true,
      s_fresh: true,
      s_viral: true,
      s_ux: true,
      s_global: true,
      seoFixes: true,
    },
  });

  // Get agency ID
  let agency = await prisma.user.findUnique({
    where: { email: 'admin@snappost.app' },
    select: { id: true, credits: true },
  });

  if (!agency) {
    agency = await prisma.user.upsert({
      where: { email: 'admin@snappost.app' },
      update: {
        role: 'AGENCY',
        credits: 99999,
      },
      create: {
        email: 'admin@snappost.app',
        name: 'Development Admin',
        role: 'AGENCY',
        credits: 99999,
      },
      select: { id: true, credits: true },
    });
  }

  const agencyId = agency.id;
  const agencyCredits = agency.credits;

  if (!site) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed border-2 border-red-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Site bulunamadı</h3>
            <p className="text-sm text-slate-600 text-center max-w-md mb-4">
              Aradığınız site mevcut değil veya silinmiş olabilir.
            </p>
            <Link href="/agency/inventory">
              <Button variant="outline">Özel Portföy'e Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse Phase 0 Data (CF Worker - default location 2840 for US)
  const defaultLocationCode = 2840;
  const phase0Data = parsePhase0Data(site.rawSeoData, defaultLocationCode);

  // Parse Phase 1 Data (DataForSEO)
  const phase1Data = parsePhase1Data(site.rawSeoData, defaultLocationCode);

  // Get SiteDNA data
  let siteDNA = null;
  let aiInsights: SiteInsights | null = null;
  try {
    const dnaData = await prisma.$queryRawUnsafe<Array<{
      "siteId": string;
      "topKeywords": string[];
      "aiInsights": any;
      "vector": string | null;
    }>>(
      `SELECT "siteId", "topKeywords", "aiInsights", "vector" FROM site_dna WHERE "siteId" = $1::text`,
      siteId
    );

    if (dnaData && dnaData.length > 0) {
      const dna = dnaData[0];
      siteDNA = {
        topKeywords: dna.topKeywords || [],
        aiInsights: dna.aiInsights as SiteInsights | null,
        hasEmbedding: !!dna.vector,
      };
      aiInsights = dna.aiInsights as SiteInsights | null;
    }
  } catch (error: any) {
    console.error('Error fetching SiteDNA:', error);
  }

  // Get similar sites (pgvector)
  let similarSites = null;
  try {
    if (siteDNA?.hasEmbedding) {
      similarSites = await findSimilarSites(siteId, 10, true);
    }
  } catch (error: any) {
    console.error('Error fetching similar sites:', error);
  }

  // Parse SEO Fixes
  const seoFixes = ((site.seoFixes as SeoFix[]) || []).sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Scores object
  const scores = {
    s_tech: site.s_tech || phase0Data.s_tech,
    s_sem: site.s_sem,
    s_link: site.s_link,
    s_schema: site.s_schema || phase0Data.s_schema,
    s_mon: site.s_mon,
    s_eeat: site.s_eeat,
    s_fresh: site.s_fresh,
    s_viral: site.s_viral,
    s_ux: site.s_ux || phase0Data.s_ux,
    s_global: site.s_global,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agency/inventory">
            <Button variant="ghost" size="sm" className="rounded-[2.5rem]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              V2 SEO Analiz
            </h1>
            <p className="mt-2 text-slate-600">{formatDomain(site.domain)}</p>
          </div>
        </div>
        <Link href={`/agency/inventory/${siteId}`}>
          <Button variant="outline" size="sm" className="rounded-[2.5rem]">
            V1 Görünüm
          </Button>
        </Link>
      </div>

      {/* V2 Client Component */}
      <InventoryV2Client
        site={site}
        agencyId={agencyId}
        agencyCredits={agencyCredits}
        phase0Data={phase0Data}
        phase1Data={phase1Data}
        scores={scores}
        aiInsights={aiInsights}
        siteDNA={siteDNA || {
          topKeywords: [],
          aiInsights: null,
          hasEmbedding: false,
        }}
        seoFixes={seoFixes}
        similarSites={similarSites}
        rawSeoData={site.rawSeoData as RawSeoDataMultiRegion | null}
      />
    </div>
  );
}

