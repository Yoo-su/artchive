import { PublicUserProfile } from "@bookjeok/core";

import { JsonLd } from "@/shared/components/json-ld";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface ProfilePageJsonLdProps {
  profile: PublicUserProfile;
  locale: string;
}

/**
 * 사용자 프로필 정보 Schema.org JSON-LD 구조화 데이터 컴포넌트
 * - Google ProfilePage 권장 사양 준수
 */
export function ProfilePageJsonLd({ profile, locale }: ProfilePageJsonLdProps) {
  const avatarUrl = getProfileImageUrl(profile.profileImageUrl);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateCreated: profile.createdAt,
    mainEntity: {
      "@type": "Person",
      name: profile.nickname,
      alternateName: profile.handle,
      identifier: profile.handle,
      image: avatarUrl || undefined,
      url: `https://bookjeok.com/${locale}/users/${profile.handle}`,
      agentInteractionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/WriteAction",
          userInteractionCount: profile.stats.reviewsCount,
        },
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/TradeAction",
          userInteractionCount: profile.stats.salesCount,
        },
      ],
    },
  };

  return <JsonLd data={jsonLd} />;
}
