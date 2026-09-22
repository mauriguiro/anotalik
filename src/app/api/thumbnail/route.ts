import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url', { status: 400 });
  }

  let domain = '';
  try {
    const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    domain = urlObj.hostname;
  } catch (e) {
    return new NextResponse('Invalid url', { status: 400 });
  }

  const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const headers = {
    'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400',
  };

  try {
    const fetchUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    const res = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      // Short timeout to not block rendering for too long on cold cache
      signal: AbortSignal.timeout(4000)
    });
    
    if (res.ok) {
      const html = await res.text();
      // Look for og:image
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) || 
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i) ||
                           html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      
      if (ogImageMatch && ogImageMatch[1]) {
        let imageUrl = ogImageMatch[1];
        // Handle relative URLs
        if (imageUrl.startsWith('/')) {
          imageUrl = new URL(imageUrl, fetchUrl).toString();
        }
        
        // Return 302 redirect to the OG image, perfectly cached
        return new NextResponse(null, {
          status: 302,
          headers: {
            ...headers,
            'Location': imageUrl
          }
        });
      }
    }
  } catch (error) {
    // Ignore fetch errors (timeout, DNS, etc) and fallback
  }

  // Fallback to favicon
  return new NextResponse(null, {
    status: 302,
    headers: {
      ...headers,
      'Location': fallbackFavicon
    }
  });
}
