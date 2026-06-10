/** @type {import('next').NextConfig} */
const supabaseUrls = [
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PROD_URL,
  process.env.NEXT_PUBLIC_SUPABASE_STAGING_URL,
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PROD_URL,
  process.env.SUPABASE_STAGING_URL,
  process.env.BAAM_SUPABASE_URL,
].filter(Boolean)

const supabaseHostnames = Array.from(
  new Set(
    supabaseUrls
      .map((value) => {
        try {
          return value ? new URL(value).hostname : undefined
        } catch {
          return undefined
        }
      })
      .filter(Boolean)
  )
)

const remotePatterns = []
for (const hostname of supabaseHostnames) {
  remotePatterns.push({
    protocol: 'https',
    hostname,
    pathname: '/storage/v1/object/public/**',
  })
}

// URL of the pureherbhealth herb store platform
// Local dev: http://localhost:3005   Production: https://pureherbhealth.com
const HERB_STORE_URL = process.env.HERB_STORE_URL || 'http://localhost:3005'

const nextConfig = {
  reactStrictMode: true,

  /**
   * Proxy ONLY the backend APIs to the herb store platform.
   * Shop/cart/checkout HTML pages are rendered natively in this app
   * using the clinic's own header, theme, and layout.
   * The x-store-slug header injected by middleware scopes each API call to the correct store.
   */
  async rewrites() {
    return [
      // Checkout pages stay proxied so the cart session cookie works seamlessly.
      // pureherbhealth uses assetPrefix=NEXT_PUBLIC_APP_URL so JS chunks load
      // from localhost:3005 directly — no ChunkLoadError.
      { source: '/:locale/checkout',        destination: `${HERB_STORE_URL}/:locale/checkout`        },
      { source: '/:locale/checkout/:path*', destination: `${HERB_STORE_URL}/:locale/checkout/:path*` },
      { source: '/:locale/login',           destination: `${HERB_STORE_URL}/:locale/login`           },
      { source: '/:locale/login/:path*',    destination: `${HERB_STORE_URL}/:locale/login/:path*`    },
      { source: '/:locale/register',        destination: `${HERB_STORE_URL}/:locale/register`        },
      { source: '/:locale/register/:path*', destination: `${HERB_STORE_URL}/:locale/register/:path*` },
      // Backend APIs only — shop/cart HTML pages are now native in this app
      { source: '/api/cart/:path*',         destination: `${HERB_STORE_URL}/api/cart/:path*`         },
      { source: '/api/products/:path*',     destination: `${HERB_STORE_URL}/api/products/:path*`     },
      { source: '/api/reviews/:path*',      destination: `${HERB_STORE_URL}/api/reviews/:path*`      },
      { source: '/api/ai/:path*',           destination: `${HERB_STORE_URL}/api/ai/:path*`           },
      { source: '/api/checkout/:path*',     destination: `${HERB_STORE_URL}/api/checkout/:path*`     },
      { source: '/api/shipping/:path*',     destination: `${HERB_STORE_URL}/api/shipping/:path*`     },
      { source: '/api/account/:path*',      destination: `${HERB_STORE_URL}/api/account/:path*`      },
      { source: '/api/orders/:path*',       destination: `${HERB_STORE_URL}/api/orders/:path*`       },
      { source: '/api/stores/:path*',       destination: `${HERB_STORE_URL}/api/stores/:path*`       },
      { source: '/api/stores',              destination: `${HERB_STORE_URL}/api/stores`               },
      { source: '/api/recommendations/:path*', destination: `${HERB_STORE_URL}/api/recommendations/:path*` },
    ]
  },

  images: {
    domains: ['localhost', 'images.unsplash.com'],
    remotePatterns,
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Enable static exports for ISR
  output: 'standalone',
}

module.exports = nextConfig
