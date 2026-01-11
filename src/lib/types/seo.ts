// Cloudflare Worker Local Audit Response
export interface LocalAuditResponse {
  // Meta Tags (18 madde)
  meta?: {
    title?: string;
    description?: string;
    h1?: string;
    h2?: string[];
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: string;
    twitterImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
  };
  
  // Links
  links?: {
    internal?: number;
    external?: number;
    broken?: number;
  };
  
  // Schema
  schema?: {
    jsonLd?: boolean;
    jsonLdErrors?: string[];
    schemaTypes?: string[];
  };
  
  // Performance
  performance?: {
    ttfb?: number;        // Time to First Byte (ms)
    lcp?: number;         // Largest Contentful Paint (ms)
    contentSize?: number; // Bytes
    lastModified?: string; // ISO 8601 format
  };
  
  // Technical
  technical?: {
    ssl?: boolean;
    robots?: string | boolean; // robots.txt content or boolean
    sitemap?: boolean;
    hreflang?: boolean;
  };
  
  // E-EAT Signals
  eeat?: {
    authorPage?: boolean;
    aboutPage?: boolean;
    contactPage?: boolean;
  };
  
  // Metadata
  _metadata?: {
    url: string;
    fetchedAt: string;
    workerVersion?: string;
  };
}

// SEO Fix Definition
export interface SeoFix {
  code: string;           // 'NO_H1', 'MISSING_CANONICAL', 'SSL_MISSING', etc.
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;        // Kullanıcı dostu mesaj
  scoreImpact?: number;   // Bu hatanın skora etkisi (0-100)
  category: 'TECHNICAL' | 'SEMANTIC' | 'SCHEMA' | 'PERFORMANCE' | 'OTHER';
}

// Scoring Metrics (10 Boyutlu)
export interface ScoringMetrics {
  s_tech: number | null;    // 0-100
  s_sem: number | null;     // 0-100
  s_link: number | null;    // 0-100
  s_schema: number | null;  // 0-100
  s_mon: number | null;     // 0-100
  s_eeat: number | null;    // 0-100
  s_fresh: number | null;   // 0-100
  s_viral: number | null;   // 0-100
  s_ux: number | null;      // 0-100
  s_global: number | null;  // 0-100 (ağırlıklı ortalama)
}

// RawSeoDataMultiRegion (Genişletilmiş)
export interface RawSeoDataMultiRegion {
  [locationCode: string]: {
    [apiName: string]: {
      data: any;
      timestamp?: string;
    };
  };
}

// Site Insights (AI Manager - Gemini)
export interface SiteInsights {
  siteCategory: string;           // e.g., "Technology", "E-Commerce", "News", "Spam"
  executiveSummary: string;       // One powerful sentence for investors
  riskLevel: "Low" | "Medium" | "High";
  estimatedMarketPrice: string;   // Estimated price range in TL
  pros: string[];                 // Array of advantages
  cons: string[];                 // Array of disadvantages
}

// 'local_audit' artık rawSeoData[locationCode]['local_audit'] olarak saklanacak

