export interface SceneConfig {
  id: "record" | "used" | "review" | "logo";
  accentClass: string;
}

export interface SceneData extends SceneConfig {
  header: string;
  sub: string;
  desc: string;
}
