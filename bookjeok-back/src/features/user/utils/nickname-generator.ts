/**
 * 랜덤 닉네임 생성 유틸리티
 * 신규 사용자 가입 시 "형용사 + 명사" 패턴의 익명 닉네임을 생성합니다.
 */

// 긍정적이고 독서/책 관련 형용사
const ADJECTIVES = [
  '행복한',
  '즐거운',
  '신나는',
  '차분한',
  '호기심많은',
  '꿈꾸는',
  '설레는',
  '따뜻한',
  '포근한',
  '용감한',
  '지혜로운',
  '부지런한',
  '느긋한',
  '활기찬',
  '상냥한',
];

// 귀여운 동물/캐릭터 명사
const NOUNS = [
  '북극곰',
  '판다',
  '고양이',
  '토끼',
  '여우',
  '펭귄',
  '다람쥐',
  '부엉이',
  '고슴도치',
  '수달',
  '코알라',
  '햄스터',
  '강아지',
  '나무늘보',
  '레서판다',
];

export class NicknameGenerator {
  /**
   * 랜덤 닉네임을 생성합니다.
   * 형식: "형용사 명사" (예: "행복한 판다")
   * @returns 생성된 닉네임
   */
  static generate(): string {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${adjective} ${noun}`;
  }

  /**
   * 랜덤 기본 프로필 이미지 번호를 반환합니다. (1~5)
   * @returns 1부터 5 사이의 숫자
   */
  static getRandomProfileNumber(): number {
    return Math.floor(Math.random() * 5) + 1;
  }
}
