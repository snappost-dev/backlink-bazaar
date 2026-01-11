-- AlterTable: Add credits to User
ALTER TABLE "users" ADD COLUMN "credits" INTEGER NOT NULL DEFAULT 100;

-- AlterTable: Add SEO fields to Site
ALTER TABLE "sites" ADD COLUMN "trafficData" JSONB;
ALTER TABLE "sites" ADD COLUMN "domainRank" INTEGER;
ALTER TABLE "sites" ADD COLUMN "spamScore" INTEGER;
ALTER TABLE "sites" ADD COLUMN "lastSeoCheck" TIMESTAMP(3);

-- CreateTable: AgencyTransaction
CREATE TABLE "agency_transactions" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agency_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agency_transactions_agencyId_idx" ON "agency_transactions"("agencyId");
CREATE INDEX "agency_transactions_type_idx" ON "agency_transactions"("type");
CREATE INDEX "agency_transactions_createdAt_idx" ON "agency_transactions"("createdAt");

-- AddForeignKey
ALTER TABLE "agency_transactions" ADD CONSTRAINT "agency_transactions_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

