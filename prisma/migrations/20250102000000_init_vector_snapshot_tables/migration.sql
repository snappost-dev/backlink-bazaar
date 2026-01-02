-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable: sites
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "finalPrice" DOUBLE PRECISION NOT NULL,
    "metrics" JSONB NOT NULL,
    "traffic" JSONB NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable: site_dna (Vector Table for Topical DNA Engine)
CREATE TABLE "site_dna" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "vector" vector(1536),
    "keywords" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_dna_pkey" PRIMARY KEY ("id")
);

-- CreateTable: scouting_history (Snapshot Table - Time Machine)
CREATE TABLE "scouting_history" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "diffSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scouting_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: sites domain unique
CREATE UNIQUE INDEX "sites_domain_key" ON "sites"("domain");

-- CreateIndex: site_dna siteId unique
CREATE UNIQUE INDEX "site_dna_siteId_key" ON "site_dna"("siteId");

-- CreateIndex: scouting_history siteId
CREATE INDEX "scouting_history_siteId_idx" ON "scouting_history"("siteId");

-- CreateIndex: scouting_history agencyId
CREATE INDEX "scouting_history_agencyId_idx" ON "scouting_history"("agencyId");

-- CreateIndex: scouting_history createdAt
CREATE INDEX "scouting_history_createdAt_idx" ON "scouting_history"("createdAt");

-- AddForeignKey: site_dna -> sites
ALTER TABLE "site_dna" ADD CONSTRAINT "site_dna_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: scouting_history -> sites
ALTER TABLE "scouting_history" ADD CONSTRAINT "scouting_history_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create vector similarity index for cosine distance search
-- This enables fast similarity queries: SELECT * FROM site_dna ORDER BY vector <-> $1 LIMIT 10;
CREATE INDEX "site_dna_vector_idx" ON "site_dna" USING ivfflat (vector vector_cosine_ops);

