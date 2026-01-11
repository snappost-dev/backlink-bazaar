"use client";

import { RawDataCards } from "./RawDataCards";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { SimilarSitesPanel } from "./SimilarSitesPanel";
import { PageLevelAnalysisPanel } from "./PageLevelAnalysisPanel";
import { HealthCheckPanel } from "@/components/agency/HealthCheckPanel";
import type { SiteInsights, SeoFix } from "@/lib/types/seo";

interface Phase1DetailedAnalysisProps {
  rankedKeywords: any[] | null;
  serpCompetitors: any[] | null;
  relevantPages: any[] | null;
  backlinkSummary: any | null;
  aiInsights: SiteInsights | null;
  scores: {
    s_tech: number | null;
    s_sem: number | null;
    s_link: number | null;
    s_schema: number | null;
    s_mon: number | null;
    s_eeat: number | null;
    s_fresh: number | null;
    s_viral: number | null;
    s_ux: number | null;
    s_global: number | null;
  };
  seoFixes: SeoFix[];
  similarSites: Array<{
    site: any;
    similarity: number;
    dna: any;
  }> | null;
  agencyId: string;
  agencyCredits: number;
}

export function Phase1DetailedAnalysis({
  rankedKeywords,
  serpCompetitors,
  relevantPages,
  backlinkSummary,
  aiInsights,
  scores,
  seoFixes,
  similarSites,
  agencyId,
  agencyCredits,
}: Phase1DetailedAnalysisProps) {
  return (
    <div className="space-y-6">
      {/* 10-Dimensional Score Visualization */}
      <HealthCheckPanel scores={scores} seoFixes={seoFixes} />

      {/* AI Analysis Panel */}
      <AIAnalysisPanel aiInsights={aiInsights} />

      {/* Similar Sites Panel (pgvector) */}
      <SimilarSitesPanel similarSites={similarSites} />

      {/* Page-Level Analysis Panel */}
      <PageLevelAnalysisPanel
        relevantPages={relevantPages}
        agencyId={agencyId}
        agencyCredits={agencyCredits}
      />

      {/* Raw Data Cards */}
      <RawDataCards
        rankedKeywords={rankedKeywords}
        serpCompetitors={serpCompetitors}
        relevantPages={relevantPages}
        backlinkSummary={backlinkSummary}
      />
    </div>
  );
}

