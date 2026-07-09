// 채팅 위젯을 띄우지 않을 웹 경로 블랙리스트 (다국어 로케일 프리픽스 제거 기준)
export const HIDE_CHAT_WIDGET_ROUTES = [
  "/share",  // 공유 전용 페이지
  "/login",  // 로그인 화면
  "/signup", // 회원가입 화면
] as const;
