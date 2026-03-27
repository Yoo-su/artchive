import { defineConfig, Options } from "tsup";

/**
 * 공유 tsup 빌드 설정 베이스
 * 모든 공유 패키지(core, api-client, react-query)가 일관된 빌드 전략을 사용합니다.
 *
 * NOTE: splitting은 다수의 entry + dts 병행 시 메모리 초과 가능성이 있어
 * 필요한 패키지에서만 명시적으로 override합니다.
 */
export const baseConfig: Options = {
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
};

export { defineConfig };
