# ⚙️ BACKLINK BAZAAR - PRODUCTION ARCHITECTURE (v1.1)
**Status:** LIVE (Railway)
**Database:** PostgreSQL + pgvector (Active)
**Rendering:** Force Dynamic (No Static Gen)

## 1. CORE INFRASTRUCTURE
- **Hosting:** Railway (Production Environment).
- **Database:** Prisma ORM. `SiteDNA` uses `vector(1536)` type via `pgvector` extension.
- **Build Strategy:** All dashboard pages use `export const dynamic = 'force-dynamic'` to prevent build errors and cache issues.
- **Crawler:** Micro-Crawler (Cheerio) active at `/api/sites/analyze`.

## 2. DATA ENTRY GATES (The Two Doors)
### A. Publisher Gate (Public)
- **Route:** `/publisher/inventory`
- **Logic:** Crawler fetches data -> Status: `PENDING` -> Needs Verification.
### B. Agency Gate (Private)
- **Route:** `/agency/inventory`
- **Logic:** Crawler fetches data -> Status: `UNVERIFIED` -> Visible in Agency Panel immediately.

## 3. AGENCY OPERATIONS (The Missing Piece) 🛠️
*Agency Admin must have full control over the inventory.*
- **Detail View:** Clicking a site card MUST open `/agency/inventory/[id]`.
- **Edit Capabilities:**
  - **Price:** Update `basePrice` and `finalPrice`.
  - **Status:** Approve (`PENDING` -> `APPROVED`) or Reject.
  - **Metrics:** Refresh traffic/DR data manually.
- **API:** Use `/api/sites/[id]/update` (PATCH) for edits.

## 4. MARKETPLACE & ORDERS
- **Buyer View:** Only sees `APPROVED` sites at `/buyer/marketplace`.
- **Order Flow:** (Next Step) Connect "Buy Now" button to `Order` table in DB.

## 5. CRITICAL RULES (Do Not Break)
- **No Mock Data:** Never use mock-data.ts. Always fetch from DB.
- **Dynamic Rendering:** Always keep pages dynamic to avoid "Export Error" on Railway.
- **Vector Type:** Respect `Unsupported("vector(1536)")` in Prisma schema.

