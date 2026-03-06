export const getJsonLd = (t: (key: string) => string) => {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: t("json_ld.name"),
        alternateName: ["북적", "bookjeok", "Bookjeok"],
        description: t("json_ld.description"),
        url: "https://bookjeok.com",
        potentialAction: {
          "@type": "SearchAction",
          target:
            "https://bookjeok.com/book/search?keyword={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        name: t("json_ld.name"),
        url: "https://bookjeok.com",
        logo: {
          "@type": "ImageObject",
          url: "https://bookjeok.com/logo-square-sketch.png",
          width: "766",
          height: "766",
          encodingFormat: "image/png",
        },
      },
      {
        "@type": "SiteNavigationElement",
        name: t("json_ld.nav.market"),
        url: "https://bookjeok.com/book/market",
      },
      {
        "@type": "SiteNavigationElement",
        name: t("json_ld.nav.review"),
        url: "https://bookjeok.com/review",
      },
      {
        "@type": "SiteNavigationElement",
        name: t("json_ld.nav.search"),
        url: "https://bookjeok.com/book/search",
      },
    ],
  };
};
