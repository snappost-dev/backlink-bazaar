import 'server-only';
import axios from 'axios';

// GEÇİCİ OLARAK HARDCODED CREDENTIALS
// Test bittikten sonra burayı tekrar process.env yapısına çevireceğiz.
const API_LOGIN = "admin@snappost.app";
const API_PASSWORD = "1cb3d2237c329968";
const BASE_URL = "https://api.dataforseo.com/v3/";

/**
 * DataForSEO API'den domain SEO verilerini çeker
 * 
 * @param domain - Analiz edilecek domain (örn: "example.com")
 * @param locationCode - ZORUNLU: Ülke lokasyon kodu (örn: 2840=US, 2792=TR)
 * @returns Ham API yanıtı (tasks dizisi) veya null
 */
export async function fetchSeoData(domain: string, locationCode: number) {
  if (!locationCode) {
    throw new Error('Location code zorunludur');
  }

  console.log(`--- SEO ANALİZ BAŞLIYOR: ${domain} (Location: ${locationCode}) ---`);
  
  const token = Buffer.from(`${API_LOGIN}:${API_PASSWORD}`).toString('base64');

  try {
    const response = await axios.post(
      `${BASE_URL}dataforseo_labs/google/historical_rank_overview/live`,
      [{
        target: domain,
        location_code: locationCode,
        language_code: "en"
      }],
      {
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // DEBUG: API'den gelen ham cevabı konsola yazdır
    console.log("🔥 [API] DataForSEO Raw Response (Full):", JSON.stringify(response.data, null, 2));

    // HAM VERİYİ HİÇ İŞLEMEDEN DÖNDÜR - Raw-Analysis-Push Mimarisi
    // tasks dizisinin tamamını döndür (işleme yapma)
    if (!response.data || !response.data.tasks || response.data.tasks.length === 0) {
        console.error("DataForSEO Sonuç Dönmedi:", response.data);
        return null;
    }

    // Ham veriyi olduğu gibi döndür + locationCode metadata ekle
    return {
      ...response.data,
      _metadata: {
        api: 'historical_rank_overview',
        locationCode: locationCode,
        domain: domain,
        fetchedAt: new Date().toISOString()
      }
    };

  } catch (error: any) {
    console.error('DataForSEO API Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Historical Rank Overview (Mevcut - API 1/7)
 */
export async function fetchHistoricalRankOverview(domain: string, locationCode: number) {
  return await fetchSeoData(domain, locationCode);
}

/**
 * Ranked Keywords API (API 2/7)
 */
export async function fetchRankedKeywords(domain: string, locationCode: number) {
  if (!locationCode) {
    throw new Error('Location code zorunludur');
  }

  console.log(`--- RANKED KEYWORDS: ${domain} (Location: ${locationCode}) ---`);
  
  const token = Buffer.from(`${API_LOGIN}:${API_PASSWORD}`).toString('base64');

  try {
    const response = await axios.post(
      `${BASE_URL}dataforseo_labs/google/ranked_keywords/live`,
      [{
        target: domain,
        location_code: locationCode,
        language_code: "en"
      }],
      {
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.tasks || response.data.tasks.length === 0) {
      console.error("Ranked Keywords Sonuç Dönmedi:", response.data);
      return null;
    }

    return {
      ...response.data,
      _metadata: {
        api: 'ranked_keywords',
        locationCode: locationCode,
        domain: domain,
        fetchedAt: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('Ranked Keywords API Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * SERP Competitors API (API 3/7)
 */
export async function fetchSerpCompetitors(domain: string, locationCode: number) {
  if (!locationCode) {
    throw new Error('Location code zorunludur');
  }

  console.log(`--- SERP COMPETITORS: ${domain} (Location: ${locationCode}) ---`);
  
  const token = Buffer.from(`${API_LOGIN}:${API_PASSWORD}`).toString('base64');

  try {
    const response = await axios.post(
      `${BASE_URL}dataforseo_labs/google/serp_competitors/live`,
      [{
        target: domain,
        location_code: locationCode,
        language_code: "en"
      }],
      {
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.tasks || response.data.tasks.length === 0) {
      console.error("SERP Competitors Sonuç Dönmedi:", response.data);
      return null;
    }

    return {
      ...response.data,
      _metadata: {
        api: 'serp_competitors',
        locationCode: locationCode,
        domain: domain,
        fetchedAt: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('SERP Competitors API Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Relevant Pages API (API 4/7)
 */
export async function fetchRelevantPages(domain: string, locationCode: number) {
  if (!locationCode) {
    throw new Error('Location code zorunludur');
  }

  console.log(`--- RELEVANT PAGES: ${domain} (Location: ${locationCode}) ---`);
  
  const token = Buffer.from(`${API_LOGIN}:${API_PASSWORD}`).toString('base64');

  try {
    const response = await axios.post(
      `${BASE_URL}dataforseo_labs/google/relevant_pages/live`,
      [{
        target: domain,
        location_code: locationCode,
        language_code: "en"
      }],
      {
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.tasks || response.data.tasks.length === 0) {
      console.error("Relevant Pages Sonuç Dönmedi:", response.data);
      return null;
    }

    return {
      ...response.data,
      _metadata: {
        api: 'relevant_pages',
        locationCode: locationCode,
        domain: domain,
        fetchedAt: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('Relevant Pages API Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Domain Intersection API (API 5/7)
 */
export async function fetchDomainIntersection(domain: string, locationCode: number) {
  if (!locationCode) {
    throw new Error('Location code zorunludur');
  }

  console.log(`--- DOMAIN INTERSECTION: ${domain} (Location: ${locationCode}) ---`);
  
  const token = Buffer.from(`${API_LOGIN}:${API_PASSWORD}`).toString('base64');

  try {
    const response = await axios.post(
      `${BASE_URL}dataforseo_labs/google/domain_intersection/live`,
      [{
        target: domain,
        location_code: locationCode,
        language_code: "en"
      }],
      {
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.tasks || response.data.tasks.length === 0) {
      console.error("Domain Intersection Sonuç Dönmedi:", response.data);
      return null;
    }

    return {
      ...response.data,
      _metadata: {
        api: 'domain_intersection',
        locationCode: locationCode,
        domain: domain,
        fetchedAt: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('Domain Intersection API Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Backlink Summary API (API 6/7)
 */
export async function fetchBacklinkSummary(domain: string) {
  console.log(`--- BACKLINK SUMMARY: ${domain} ---`);
  
  const token = Buffer.from(`${API_LOGIN}:${API_PASSWORD}`).toString('base64');

  try {
    const response = await axios.post(
      `${BASE_URL}backlinks/summary/live`,
      [{
        target: domain
      }],
      {
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.tasks || response.data.tasks.length === 0) {
      console.error("Backlink Summary Sonuç Dönmedi:", response.data);
      return null;
    }

    return {
      ...response.data,
      _metadata: {
        api: 'backlink_summary',
        domain: domain,
        fetchedAt: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('Backlink Summary API Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Backlink History API (API 7/7)
 */
export async function fetchBacklinkHistory(domain: string) {
  console.log(`--- BACKLINK HISTORY: ${domain} ---`);
  
  const token = Buffer.from(`${API_LOGIN}:${API_PASSWORD}`).toString('base64');

  try {
    const response = await axios.post(
      `${BASE_URL}backlinks/history/live`,
      [{
        target: domain
      }],
      {
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.tasks || response.data.tasks.length === 0) {
      console.error("Backlink History Sonuç Dönmedi:", response.data);
      return null;
    }

    return {
      ...response.data,
      _metadata: {
        api: 'backlink_history',
        domain: domain,
        fetchedAt: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('Backlink History API Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Domain'in geçerli olup olmadığını kontrol eder
 */
export function validateDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  // Basit domain validasyonu
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  return domainRegex.test(domain.trim());
}
