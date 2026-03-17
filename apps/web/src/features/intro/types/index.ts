export const SCENE_IDS = ["record", "used", "review", "logo"] as const;
export type SceneId = (typeof SCENE_IDS)[number];

export interface SceneData {
  id: SceneId;
  header: string; // 헤더 텍스트
  sub: string; // 서브 텍스트
  desc: string; // 설명 텍스트
  accentClass: string; // 강조 색상 클래스
}
