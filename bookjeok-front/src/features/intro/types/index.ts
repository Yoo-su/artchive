export type SceneId = "record" | "used" | "review";

export interface SceneData {
  id: SceneId;
  header: string; // 헤더 텍스트
  sub: string; // 서브 텍스트
  desc: string; // 설명 텍스트
  accentClass: string; // 강조 색상 클래스
}
