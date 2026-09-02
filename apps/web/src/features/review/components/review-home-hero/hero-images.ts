export const HERO_IMAGES = [
  "/images/review_home_covers/review_list_cover.jpg",
  "/images/review_home_covers/review_list_cover2.jpg",
  "/images/review_home_covers/review_list_cover3.jpg",
  "/images/review_home_covers/review_list_cover4.jpg",
];

/**
 * 히어로 배경 이미지를 무작위로 하나 고릅니다.
 *
 * 서버 컴포넌트에서 호출해 prop으로 내려주세요. 컴포넌트 내부에서
 * Math.random()을 호출하면 서버와 클라이언트가 서로 다른 이미지를 골라
 * 하이드레이션 불일치가 발생합니다.
 */
export const pickHeroImage = () =>
  HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];
