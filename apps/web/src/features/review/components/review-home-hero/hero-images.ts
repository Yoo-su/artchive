export const HERO_IMAGES = [
  "/images/review_home_covers/review_list_cover.jpg",
  "/images/review_home_covers/review_list_cover2.jpg",
  "/images/review_home_covers/review_list_cover3.jpg",
  "/images/review_home_covers/review_list_cover4.jpg",
];

/**
 * 히어로 배경 이미지를 무작위로 선택합니다.
 * 컴포넌트 내부에서 호출하면 서버/클라이언트가 다른 이미지를 골라 하이드레이션
 * 불일치가 발생하므로, 서버 컴포넌트에서 호출해 prop으로 전달합니다.
 */
export const pickHeroImage = () =>
  HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];
