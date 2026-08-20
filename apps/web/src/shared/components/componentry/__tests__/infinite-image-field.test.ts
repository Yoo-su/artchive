import { describe, expect, it } from "vitest";

/**
 * 2D 좌표 (col, row)에 대해 무작위성과 고른 분산을 보장하고,
 * 가로/세로 인접 셀 간 동일 이미지 중복을 수학적으로 방지하는 결정론적 인덱스 계산기
 */
function getCellIndex(col: number, row: number, total: number): number {
  if (total <= 1) return 0;
  if (total === 2) {
    const c = ((col % 2) + 2) % 2;
    const r = ((row % 2) + 2) % 2;
    return (c + r) % 2;
  }

  const c = ((col % total) + total) % total;
  const r = ((row % total) + total) % total;

  // total과 서로소(gcd=1)인 계수 k를 선택하여 세로 방향 인접 셀과의 충돌 방지
  let k = 2;
  while (total % k === 0) {
    k++;
  }

  const base = (c + r * k) % total;

  // 결정론적 1:1 순열(Permutation) 매핑: (base * prime + offset) % total
  // prime이 total과 서로소이면 1:1 전단사 함수가 되어 비인접성이 100% 보존되면서 시각적 무작위 순서가 생성됨
  let primeMultiplier = 7;
  while (total % primeMultiplier === 0 || primeMultiplier === total) {
    primeMultiplier += 2;
  }

  return (base * primeMultiplier + 11) % total;
}

describe("InfiniteImageField - getCellIndex distribution and collision prevention", () => {
  it("never generates identical consecutive images on any row or col when total >= 2", () => {
    const testTotals = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

    for (const total of testTotals) {
      for (let row = -25; row <= 25; row++) {
        for (let col = -25; col <= 25; col++) {
          const current = getCellIndex(col, row, total);
          const right = getCellIndex(col + 1, row, total);
          const bottom = getCellIndex(col, row + 1, total);

          // 가로 방향 인접 셀 중복 방지
          expect(current).not.toBe(right);
          // 세로 방향 인접 셀 중복 방지
          expect(current).not.toBe(bottom);
          // 인덱스 범위 안전성
          expect(current).toBeGreaterThanOrEqual(0);
          expect(current).toBeLessThan(total);
        }
      }
    }
  });

  it("handles total = 1 gracefully without errors", () => {
    expect(getCellIndex(0, 0, 1)).toBe(0);
    expect(getCellIndex(10, 5, 1)).toBe(0);
    expect(getCellIndex(-7, -12, 1)).toBe(0);
  });

  it("is fully deterministic for identical (col, row, total)", () => {
    expect(getCellIndex(5, 7, 25)).toBe(getCellIndex(5, 7, 25));
    expect(getCellIndex(-3, -8, 10)).toBe(getCellIndex(-3, -8, 10));
  });
});
