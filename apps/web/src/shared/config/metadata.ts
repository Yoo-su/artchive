import { Metadata } from "next";

export const generateGlobalMetadata = (
  t: (key: string) => string,
): Metadata => {
  return {
    metadataBase: new URL("https://bookjeok.com"),
    title: {
      template: t("meta.template_title"),
      default: t("meta.default_title"),
    },
    applicationName: "Bookjeok", // Brand name usually stays same or simple transliteration
    appleWebApp: {
      title: "Bookjeok",
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/logo-square-sketch.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/logo-square-sketch.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/logo-square-sketch.png", sizes: "512x512", type: "image/png" },
      ],
    },
    description: t("meta.description"),
    keywords: t("meta.keywords").split(","),
    alternates: {
      types: {
        "application/rss+xml": [
          { url: "/rss.xml", title: "북적 RSS 피드" },
        ],
      },
    },
    openGraph: {
      title: t("meta.og.title"),
      description: t("meta.og.description"),
      url: "https://bookjeok.com",
      siteName: "Bookjeok",
      images: [
        {
          url: "/logo-og-sketch.png",
          width: 1200,
          height: 630,
          alt: t("meta.default_title"),
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.twitter.title"),
      description: t("meta.twitter.description"),
      images: ["/logo-og-sketch.png"],
    },
    robots:
      process.env.VERCEL_ENV === "preview"
        ? { index: false, follow: false }
        : {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              "max-video-preview": -1,
              "max-image-preview": "large",
              "max-snippet": -1,
            },
          },
    verification: {
      google: "04FIlPfM3tjBU80tzoVObOuhIYffXxg0AzUK8ZuL41s",
      other: {
        "naver-site-verification": "3f5c1201020029acfa61cba1ea4057dd25e1e0b0",
      },
    },
  };
};

type CreatePageMetadataProps = {
  title: string;
  description: string;
  imageUrl?: string | null;
  locale?: string;
  path?: string;
  noIndex?: boolean;
};

export const createPageMetadata = ({
  title,
  description,
  imageUrl,
  locale,
  path,
  noIndex = false,
}: CreatePageMetadataProps): Metadata => {
  const images = imageUrl ? [imageUrl] : ["/logo-og-sketch.png"];
  const currentLocale = locale || "ko";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const fullPath = `/${currentLocale}${cleanPath}`;

  const metadata: Metadata = {
    metadataBase: new URL("https://bookjeok.com"),
    title,
    description,
    openGraph: {
      title: `${title} | 북적`,
      description,
      images,
      siteName: "Bookjeok",
      type: "website",
      url: path !== undefined ? `https://bookjeok.com${fullPath}` : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: `${title} | 북적`,
      description,
      images,
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  };

  if (path !== undefined) {
    metadata.alternates = {
      canonical: fullPath,
      languages: {
        ko: `/ko${cleanPath}`,
        en: `/en${cleanPath}`,
        "x-default": `/ko${cleanPath}`,
      },
    };
  }

  return metadata;
};
