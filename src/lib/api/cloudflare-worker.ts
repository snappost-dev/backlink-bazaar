import 'server-only';
import axios from 'axios';
import type { LocalAuditResponse } from '@/lib/types/seo';

const CF_WORKER_URL = process.env.CF_WORKER_URL || 'https://seo-worker.snappost.com';
const CF_WORKER_API_KEY = process.env.CF_WORKER_API_KEY; // Optional

/**
 * Cloudflare Worker'dan Local Audit verisi çeker
 * 
 * @param url - Analiz edilecek URL (https://domain.com)
 * @returns LocalAuditResponse veya null
 */
export async function fetchLocalAudit(url: string): Promise<LocalAuditResponse | null> {
  console.log(`--- LOCAL AUDIT: ${url} ---`);
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (CF_WORKER_API_KEY) {
      headers['Authorization'] = `Bearer ${CF_WORKER_API_KEY}`;
    }
    
    const response = await axios.post(
      `${CF_WORKER_URL}/audit`,
      { url },
      {
        headers,
        timeout: 30000, // 30 saniye timeout
      }
    );
    
    if (!response.data) {
      console.error("Local Audit Sonuç Dönmedi:", response.data);
      return null;
    }
    
    // Metadata ekle
    return {
      ...response.data,
      _metadata: {
        url: url,
        fetchedAt: new Date().toISOString(),
        workerVersion: response.data._metadata?.workerVersion,
      },
    };
  } catch (error: any) {
    console.error('CF Worker API Error:', error.response?.data || error.message);
    return null;
  }
}

