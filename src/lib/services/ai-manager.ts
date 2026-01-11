import 'server-only';
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SiteInsights } from '@/lib/types/seo';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.warn('⚠️ [AI MANAGER] GOOGLE_API_KEY environment variable is not set. AI insights will not be available.');
}

const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

/**
 * AI Manager Service
 * 
 * Uses Google Gemini 1.5 Flash to analyze SEO data and generate investment insights.
 * This is a lightweight AI service for quick analysis without heavy processing.
 */

/**
 * Generate site insights using Google Gemini 1.5 Flash
 * 
 * Analyzes SEO metrics and provides structured investment recommendations.
 * Returns null on any error (graceful degradation).
 * 
 * @param siteUrl - Website URL to analyze (e.g., "https://example.com")
 * @param seoData - SEO metrics object containing techScore, trafficValue, topKeywords, etc.
 * @returns SiteInsights object or null if generation fails
 */
export async function generateSiteInsights(
  siteUrl: string,
  seoData: {
    techScore?: number;
    trafficValue?: number;
    topKeywords?: string[] | any[];
    globalScore?: number;
    [key: string]: any;  // Flexible for additional data
  }
): Promise<SiteInsights | null> {
  // Early return if API key is missing
  if (!genAI || !GOOGLE_API_KEY) {
    console.warn('⚠️ [AI MANAGER] Cannot generate insights: GOOGLE_API_KEY not configured');
    return null;
  }

  try {
    // Initialize model (must be gemini-1.5-flash for speed/cost)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format top keywords for prompt
    let keywordsText = 'N/A';
    if (seoData.topKeywords && Array.isArray(seoData.topKeywords)) {
      if (seoData.topKeywords.length > 0) {
        // Handle both string arrays and object arrays (e.g., from ranked_keywords API)
        const keywordStrings = seoData.topKeywords.map((kw: any) => {
          if (typeof kw === 'string') return kw;
          if (kw.keyword) return kw.keyword;
          if (kw.se_keyword) return kw.se_keyword;
          return String(kw);
        }).slice(0, 20); // Limit to top 20 keywords
        keywordsText = keywordStrings.join(', ');
      }
    }

    // Build comprehensive prompt
    const prompt = `You are an Expert SEO & Investment Consultant analyzing a website for potential investors.

Analyze this website based on the following metrics:

URL: ${siteUrl}
Technical SEO Score: ${seoData.techScore ?? 'N/A'} / 100
Global SEO Score: ${seoData.globalScore ?? 'N/A'} / 100
Estimated Traffic Value: ${seoData.trafficValue ? seoData.trafficValue.toLocaleString() : 'N/A'}
Top Keywords: ${keywordsText}

Additional Context:
${JSON.stringify(seoData, null, 2)}

IMPORTANT: Return ONLY valid JSON matching this exact schema (no markdown, no explanations, no code blocks):

{
  "siteCategory": "Technology | E-Commerce | News | Blog | Spam | Content | Other",
  "executiveSummary": "One powerful sentence (max 150 characters) for investors summarizing the site's investment potential",
  "riskLevel": "Low | Medium | High",
  "estimatedMarketPrice": "Price range in Turkish Lira (TL), e.g., '50,000 - 100,000 TL' or 'Under 10,000 TL'",
  "pros": ["Advantage 1", "Advantage 2", "Advantage 3"],
  "cons": ["Disadvantage 1", "Disadvantage 2", "Disadvantage 3"]
}

Requirements:
- siteCategory: Categorize the site (be specific, avoid generic terms)
- executiveSummary: One compelling sentence for investors, focus on ROI potential
- riskLevel: Assess investment risk (Low = stable traffic/domain, Medium = moderate risk, High = volatile/unreliable)
- estimatedMarketPrice: Realistic price range in TL based on traffic value and domain authority
- pros: 2-4 key advantages (focus on monetization potential, traffic quality, domain authority)
- cons: 2-4 key concerns (focus on risks, technical issues, market position)

Return ONLY the JSON object, nothing else.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean markdown code blocks if present
    let jsonStr = text.trim();
    
    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // If response starts with { and ends with }, extract just that part
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    // Parse JSON
    const insights = JSON.parse(jsonStr) as SiteInsights;

    // Validate structure
    if (
      typeof insights.siteCategory !== 'string' ||
      typeof insights.executiveSummary !== 'string' ||
      !['Low', 'Medium', 'High'].includes(insights.riskLevel) ||
      typeof insights.estimatedMarketPrice !== 'string' ||
      !Array.isArray(insights.pros) ||
      !Array.isArray(insights.cons)
    ) {
      console.error('❌ [AI MANAGER] Invalid response structure from Gemini');
      return null;
    }

    console.log('✅ [AI MANAGER] Site insights generated successfully');
    return insights;

  } catch (error: any) {
    // Comprehensive error handling
    if (error.message?.includes('API_KEY')) {
      console.error('❌ [AI MANAGER] Invalid API key:', error.message);
    } else if (error.message?.includes('JSON')) {
      console.error('❌ [AI MANAGER] JSON parsing error:', error.message);
      console.error('Raw response:', error);
    } else if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      console.error('❌ [AI MANAGER] Request timeout:', error.message);
    } else if (error.response) {
      console.error('❌ [AI MANAGER] API error:', error.response.status, error.response.data);
    } else {
      console.error('❌ [AI MANAGER] Unexpected error:', error.message || error);
    }
    
    // Return null on any error (graceful degradation)
    return null;
  }
}

