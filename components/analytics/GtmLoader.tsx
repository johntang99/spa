import Script from 'next/script';

/**
 * Google Tag Manager loader.
 *
 * Renders the canonical GTM head + body snippets. Pair with
 * `gtm-template-v1.json` in baam-platform's docs/integration so the
 * container's tags/triggers/variables are configured.
 *
 * `containerId` should be 'GTM-XXXXXXX'. If null/empty, this renders
 * nothing — the caller controls per-tenant gating via site.gtmContainerId.
 */
export default function GtmLoader({ containerId }: { containerId?: string }) {
  if (!containerId) return null;
  // Validate shape so a malformed value doesn't inject arbitrary HTML.
  if (!/^GTM-[A-Z0-9]+$/.test(containerId)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[GtmLoader] Ignoring invalid GTM container id: ${containerId}`,
      );
    }
    return null;
  }

  return (
    <>
      <Script
        id="gtm-loader"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${containerId}');`,
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height={0}
          width={0}
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}
