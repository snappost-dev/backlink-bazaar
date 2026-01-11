-- AlterTable: Add 10-dimensional scoring fields + seoFixes (Hybrid SEO Engine v2.0)
-- This migration adds support for 10-dimensional SEO scoring system

-- Update snappostScore to have default value of 0
ALTER TABLE "Site" ALTER COLUMN "snappostScore" SET DEFAULT 0;

-- Add 10-dimensional sub-score fields
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "s_tech" INTEGER;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "s_sem" INTEGER;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "s_link" INTEGER;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "s_schema" INTEGER;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "s_mon" INTEGER;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "s_eeat" INTEGER;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "s_fresh" INTEGER;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "s_viral" INTEGER;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "s_ux" INTEGER;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "s_global" INTEGER;

-- Add seoFixes JSON field for action recommendations
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "seoFixes" JSONB;

-- Add comments for documentation
COMMENT ON COLUMN "Site"."s_tech" IS 'Technical Score (CF Worker)';
COMMENT ON COLUMN "Site"."s_sem" IS 'Semantic Score (DFS + CF)';
COMMENT ON COLUMN "Site"."s_link" IS 'Link Equity (DFS)';
COMMENT ON COLUMN "Site"."s_schema" IS 'Schema Health (CF)';
COMMENT ON COLUMN "Site"."s_mon" IS 'Monetization (DFS)';
COMMENT ON COLUMN "Site"."s_eeat" IS 'Trust Rank (E-EAT) (DFS)';
COMMENT ON COLUMN "Site"."s_fresh" IS 'Freshness (CF + DFS)';
COMMENT ON COLUMN "Site"."s_viral" IS 'Viral Potential (CF)';
COMMENT ON COLUMN "Site"."s_ux" IS 'UX Flow (CF Browser Rendering)';
COMMENT ON COLUMN "Site"."s_global" IS 'Calculated Weighted Score';
COMMENT ON COLUMN "Site"."seoFixes" IS 'SEO Fix List: [{ code, priority, message, scoreImpact, category }]';

