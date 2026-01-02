import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// POST: Micro-Crawler - URL'den HTML çek ve metadata çıkar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'URL is required',
        },
        { status: 400 }
      );
    }

    // URL validation
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL format',
        },
        { status: 400 }
      );
    }

    // Fetch HTML
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const title =
      $('title').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      'No title found';

    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      'No description found';

    const h1 = $('h1').first().text().trim() || null;
    const h2 = $('h2').first().text().trim() || null;

    // Extract domain from URL
    const urlObj = new URL(targetUrl);
    const domain = urlObj.hostname.replace('www.', '');

    // Category inference (basit keyword matching)
    const content = (title + ' ' + description).toLowerCase();
    let inferredCategory = 'Technology';
    if (content.includes('health') || content.includes('medical') || content.includes('sağlık')) {
      inferredCategory = 'Health';
    } else if (content.includes('finance') || content.includes('money') || content.includes('finans')) {
      inferredCategory = 'Finance';
    } else if (content.includes('business') || content.includes('iş')) {
      inferredCategory = 'Business';
    } else if (content.includes('education') || content.includes('eğitim')) {
      inferredCategory = 'Education';
    } else if (content.includes('lifestyle') || content.includes('yaşam')) {
      inferredCategory = 'Lifestyle';
    }

    return NextResponse.json({
      success: true,
      data: {
        url: targetUrl,
        domain,
        title,
        description,
        h1,
        h2,
        inferredCategory,
        metadata: {
          ogTitle: $('meta[property="og:title"]').attr('content') || null,
          ogImage: $('meta[property="og:image"]').attr('content') || null,
          ogType: $('meta[property="og:type"]').attr('content') || null,
        },
      },
    });
  } catch (error: any) {
    console.error('Crawler error:', error);

    // Timeout error
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timeout - Site did not respond in time',
        },
        { status: 408 }
      );
    }

    // Network error
    if (error.message.includes('fetch')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch URL - Check if site is accessible',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze site',
      },
      { status: 500 }
    );
  }
}

