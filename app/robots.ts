import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getBaseUrlFromHost } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/components-preview'],
      },
    ],
    sitemap: new URL('/sitemap.xml', baseUrl).toString(),
  };
}
