-- Migration: Add Data Entry Gates (Publisher vs Agency)
-- Adds origin, verificationStatus, isPrivate, and publisherId fields to sites table

-- Add publisherId column (nullable FK to users)
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "publisherId" TEXT;

-- Add origin column (PUBLISHER_OWNED or AGENCY_PORTFOLIO)
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "origin" TEXT NOT NULL DEFAULT 'PUBLISHER_OWNED';

-- Add verificationStatus column (PENDING, VERIFIED, UNVERIFIED, REJECTED)
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- Add isPrivate column (boolean flag for agency private portfolio)
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "sites_publisherId_idx" ON "sites"("publisherId");
CREATE INDEX IF NOT EXISTS "sites_origin_idx" ON "sites"("origin");
CREATE INDEX IF NOT EXISTS "sites_verificationStatus_idx" ON "sites"("verificationStatus");

-- Add foreign key constraint for publisherId (if users table exists)
-- Note: This will fail if users table doesn't exist yet, but that's okay
-- The constraint will be added when users table is created
-- ALTER TABLE "sites" ADD CONSTRAINT "sites_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

