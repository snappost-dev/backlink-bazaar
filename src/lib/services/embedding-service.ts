import 'server-only';
import type { SiteInsights } from '@/lib/types/seo';

/**
 * Embedding Service
 * 
 * Generates 1536-dimensional embeddings for vector similarity search.
 * Supports multiple strategies: OpenAI (preferred), text-to-hash fallback.
 * 
 * Note: Gemini 1.5 Flash doesn't have direct embedding API, so we use
 * OpenAI for embeddings or fallback to hash-based method.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding from text using OpenAI (if available) or fallback method
 * 
 * @param text - Text to generate embedding from
 * @returns 1536-dimensional embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Try OpenAI first (preferred method)
  if (OPENAI_API_KEY) {
    try {
      return await generateOpenAIEmbedding(text);
    } catch (error: any) {
      console.warn('⚠️ [EMBEDDING] OpenAI embedding failed, using fallback:', error.message);
      // Fall through to fallback method
    }
  }

  // Fallback: Text-to-hash-based embedding (temporary solution)
  return generateHashBasedEmbedding(text);
}

/**
 * Generate embedding using OpenAI API
 * 
 * @param text - Text to generate embedding from
 * @returns 1536-dimensional embedding vector
 */
async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    // Dynamic import to avoid bundling OpenAI SDK if not needed
    // This will fail gracefully if openai package is not installed
    // @ts-expect-error - OpenAI package is optional, type will be available if installed
    const openaiModule = await import('openai').catch((err) => {
      console.warn('⚠️ [EMBEDDING] OpenAI package not installed, using fallback:', err.message);
      throw new Error('OpenAI package not installed');
    });
    
    const { default: OpenAI } = openaiModule;
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large', // 1536 dimensions
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    if (!response.data || response.data.length === 0 || !response.data[0].embedding) {
      throw new Error('OpenAI embedding response is empty');
    }

    return response.data[0].embedding;
  } catch (error: any) {
    if (error.message === 'OpenAI package not installed') {
      throw error; // Re-throw to use fallback
    }
    console.error('❌ [EMBEDDING] OpenAI API error:', error.message);
    throw error;
  }
}

/**
 * Generate hash-based embedding (fallback method)
 * 
 * Creates a deterministic 1536-dimensional vector from text using hash-based algorithm.
 * Less semantically meaningful than real embeddings, but works without API.
 * 
 * @param text - Text to generate embedding from
 * @returns 1536-dimensional embedding vector (normalized to 0-1 range)
 */
function generateHashBasedEmbedding(text: string): number[] {
  const vector: number[] = [];
  
  // Create hash from text
  const hash = text.split('').reduce((acc, char, index) => {
    return acc + char.charCodeAt(0) * (index + 1);
  }, 0);
  
  // Generate deterministic vector from hash
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    const seed = (hash + i * 31) % 10000; // Larger prime for better distribution
    const value = Math.sin(seed / 1000) * Math.cos(seed / 2000);
    // Normalize to 0-1 range
    vector.push((value + 1) / 2);
  }
  
  return vector;
}

/**
 * Generate SiteDNA embedding from combined AI insights and SEO data
 * 
 * Creates a text representation from SiteInsights + SEO metrics, then generates embedding.
 * This embedding captures the semantic meaning of the site for similarity matching.
 * 
 * @param siteInsights - Gemini AI insights (category, summary, risk, etc.)
 * @param seoData - SEO metrics (scores, traffic value, keywords, etc.)
 * @returns 1536-dimensional embedding vector
 */
export async function generateSiteDNAEmbedding(
  siteInsights: SiteInsights | null,
  seoData: {
    techScore?: number | null;
    globalScore?: number | null;
    trafficValue?: number | null;
    topKeywords?: string[] | any[];
    [key: string]: any;
  }
): Promise<number[]> {
  // Build comprehensive text representation
  const textParts: string[] = [];

  // Add AI insights (if available)
  if (siteInsights) {
    textParts.push(`Category: ${siteInsights.siteCategory}`);
    textParts.push(`Summary: ${siteInsights.executiveSummary}`);
    textParts.push(`Risk Level: ${siteInsights.riskLevel}`);
    textParts.push(`Price: ${siteInsights.estimatedMarketPrice}`);
    if (siteInsights.pros && siteInsights.pros.length > 0) {
      textParts.push(`Pros: ${siteInsights.pros.join(', ')}`);
    }
    if (siteInsights.cons && siteInsights.cons.length > 0) {
      textParts.push(`Cons: ${siteInsights.cons.join(', ')}`);
    }
  }

  // Add SEO scores (handle null values)
  const techScore = seoData.techScore ?? null;
  const globalScore = seoData.globalScore ?? null;
  const trafficValue = seoData.trafficValue ?? null;

  if (techScore !== null && techScore !== undefined) {
    textParts.push(`Technical Score: ${techScore}/100`);
  }
  if (globalScore !== null && globalScore !== undefined) {
    textParts.push(`Global SEO Score: ${globalScore}/100`);
  }
  if (trafficValue !== null && trafficValue !== undefined) {
    textParts.push(`Traffic Value: ${trafficValue}`);
  }

  // Add keywords (most important for semantic matching)
  if (seoData.topKeywords && Array.isArray(seoData.topKeywords) && seoData.topKeywords.length > 0) {
    const keywordStrings = seoData.topKeywords
      .map((kw: any) => {
        if (typeof kw === 'string') return kw;
        if (kw.keyword) return kw.keyword;
        if (kw.se_keyword) return kw.se_keyword;
        return String(kw);
      })
      .slice(0, 50) // Top 50 keywords for embedding
      .join(' ');
    
    if (keywordStrings) {
      textParts.push(`Keywords: ${keywordStrings}`);
    }
  }

  // Add additional SEO metrics (scores)
  const scoreFields = ['s_sem', 's_link', 's_schema', 's_mon', 's_eeat', 's_fresh', 's_viral', 's_ux'];
  const scoreTexts: string[] = [];
  
  for (const field of scoreFields) {
    if (seoData[field] !== null && seoData[field] !== undefined) {
      scoreTexts.push(`${field}: ${seoData[field]}`);
    }
  }
  
  if (scoreTexts.length > 0) {
    textParts.push(`SEO Scores: ${scoreTexts.join(', ')}`);
  }

  // Combine all text parts
  const combinedText = textParts.join('. ');

  // Generate embedding from combined text
  return await generateEmbedding(combinedText);
}

/**
 * Validate embedding vector
 * 
 * @param embedding - Embedding vector to validate
 * @returns true if valid (1536 dimensions, all numbers)
 */
export function validateEmbedding(embedding: number[]): boolean {
  if (!Array.isArray(embedding)) {
    return false;
  }

  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    return false;
  }

  // Check all values are numbers and in valid range
  for (const value of embedding) {
    if (typeof value !== 'number' || !isFinite(value)) {
      return false;
    }
  }

  return true;
}

/**
 * Normalize embedding vector (L2 normalization)
 * 
 * @param embedding - Embedding vector to normalize
 * @returns Normalized embedding vector
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude === 0) {
    return embedding; // Zero vector, return as is
  }

  return embedding.map(val => val / magnitude);
}

