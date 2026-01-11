-- Enable pgvector extension for vector similarity search
-- This migration must be run MANUALLY before running prisma db push
-- The extension needs to be installed on the PostgreSQL server first
-- 
-- For Railway/Cloud PostgreSQL:
-- You may need to request extension installation or install it manually
-- 
-- For local PostgreSQL:
-- Install pgvector: https://github.com/pgvector/pgvector#installation
-- Then run this SQL manually or via psql

-- Enable the vector extension (will fail if pgvector is not installed)
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

