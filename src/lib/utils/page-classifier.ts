/**
 * Page Type Classifier Utility
 * 
 * URL pattern bazlı sayfa tipi tespiti
 * Blog, Content, Product, Homepage, Other kategorileri
 */

export type PageType = 'HOMEPAGE' | 'BLOG' | 'CONTENT' | 'PRODUCT' | 'OTHER';

/**
 * Sayfa tipini URL'den tespit et
 * 
 * @param url - Analiz edilecek sayfa URL'i
 * @returns PageType
 */
export function classifyPageType(url: string): PageType {
  if (!url || typeof url !== 'string') {
    return 'OTHER';
  }

  // Normalize URL (remove protocol, trailing slash)
  const normalizedUrl = url
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  
  // Extract path
  const pathMatch = normalizedUrl.match(/\/(.+)$/);
  const path = pathMatch ? pathMatch[1] : '';
  
  // Homepage check
  if (!path || path === '' || path === 'index' || path === 'index.html') {
    return 'HOMEPAGE';
  }

  // Blog patterns
  const blogPatterns = [
    '/blog/',
    '/post/',
    '/posts/',
    '/article/',
    '/articles/',
    '/news/',
    '/updates/',
    '/journal/',
    '/diary/',
    '/magazine/',
  ];
  
  if (blogPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
    return 'BLOG';
  }

  // Content patterns
  const contentPatterns = [
    '/content/',
    '/guide/',
    '/guides/',
    '/how-to/',
    '/tutorial/',
    '/tutorials/',
    '/resources/',
    '/resource/',
    '/learn/',
    '/learning/',
    '/docs/',
    '/documentation/',
    '/help/',
    '/faq/',
    '/faqs/',
  ];
  
  if (contentPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
    return 'CONTENT';
  }

  // Product patterns
  const productPatterns = [
    '/product/',
    '/products/',
    '/shop/',
    '/store/',
    '/item/',
    '/items/',
    '/buy/',
    '/purchase/',
    '/cart/',
    '/checkout/',
  ];
  
  if (productPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
    return 'PRODUCT';
  }

  return 'OTHER';
}

/**
 * Sayfa tipi için badge rengi
 */
export function getPageTypeColor(pageType: PageType): string {
  switch (pageType) {
    case 'HOMEPAGE':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'BLOG':
      return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'CONTENT':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'PRODUCT':
      return 'bg-orange-100 text-orange-700 border-orange-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
}

/**
 * Sayfa tipi için icon
 */
export function getPageTypeIcon(pageType: PageType): string {
  switch (pageType) {
    case 'HOMEPAGE':
      return '🏠';
    case 'BLOG':
      return '📝';
    case 'CONTENT':
      return '📚';
    case 'PRODUCT':
      return '🛍️';
    default:
      return '📄';
  }
}

