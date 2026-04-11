import Script from "next/script";

import { config } from "@/shared/config/env";

const GoogleAnalytics = () => {
  const gaId = config.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!gaId) {
    return null;
  }

  return (
    <>
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;
