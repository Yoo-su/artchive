/**
 * 북적 서비스 에러 코드 정의
 *
 * 에러 코드 체계:
 * - AUTH_xxx: 인증 관련 에러
 * - USER_xxx: 사용자 관련 에러
 * - BOOK_xxx: 책 관련 에러
 * - SALE_xxx: 판매글 관련 에러
 * - REVIEW_xxx: 리뷰 관련 에러
 * - COMMENT_xxx: 댓글 관련 에러
 * - CHAT_xxx: 채팅 관련 에러
 * - VALIDATION_xxx: 입력값 검증 관련 에러
 * - INTERNAL_xxx: 서버 내부 에러
 */
export const ERROR_CODES = {
  // ============================================
  // 인증 관련 에러 (AUTH)
  // ============================================
  AUTH_INVALID_TOKEN: {
    code: 'AUTH_001',
    message: '유효하지 않은 토큰입니다.',
  },
  AUTH_TOKEN_EXPIRED: {
    code: 'AUTH_002',
    message: '토큰이 만료되었습니다.',
  },
  AUTH_UNAUTHORIZED: {
    code: 'AUTH_003',
    message: '인증이 필요합니다.',
  },
  AUTH_FORBIDDEN: {
    code: 'AUTH_004',
    message: '접근 권한이 없습니다.',
  },

  // ============================================
  // 사용자 관련 에러 (USER)
  // ============================================
  USER_NOT_FOUND: {
    code: 'USER_001',
    message: '사용자를 찾을 수 없습니다.',
  },
  USER_ALREADY_EXISTS: {
    code: 'USER_002',
    message: '이미 존재하는 사용자입니다.',
  },

  // ============================================
  // 책 관련 에러 (BOOK)
  // ============================================
  BOOK_NOT_FOUND: {
    code: 'BOOK_001',
    message: '책을 찾을 수 없습니다.',
  },

  // ============================================
  // 판매글 관련 에러 (SALE)
  // ============================================
  SALE_NOT_FOUND: {
    code: 'SALE_001',
    message: '판매글을 찾을 수 없습니다.',
  },
  SALE_FORBIDDEN: {
    code: 'SALE_002',
    message: '판매글을 수정하거나 삭제할 권한이 없습니다.',
  },
  SALE_ALREADY_SOLD: {
    code: 'SALE_003',
    message: '이미 판매 완료된 상품입니다.',
  },

  // ============================================
  // 리뷰 관련 에러 (REVIEW)
  // ============================================
  REVIEW_NOT_FOUND: {
    code: 'REVIEW_001',
    message: '리뷰를 찾을 수 없습니다.',
  },
  REVIEW_FORBIDDEN: {
    code: 'REVIEW_002',
    message: '리뷰를 수정하거나 삭제할 권한이 없습니다.',
  },

  // ============================================
  // 댓글 관련 에러 (COMMENT)
  // ============================================
  COMMENT_NOT_FOUND: {
    code: 'COMMENT_001',
    message: '댓글을 찾을 수 없습니다.',
  },
  COMMENT_FORBIDDEN: {
    code: 'COMMENT_002',
    message: '댓글을 수정하거나 삭제할 권한이 없습니다.',
  },

  // ============================================
  // 독서 기록 관련 에러 (READING_LOG)
  // ============================================
  READING_LOG_NOT_FOUND: {
    code: 'READING_LOG_001',
    message: '독서 기록을 찾을 수 없습니다.',
  },

  // ============================================
  // 채팅 관련 에러 (CHAT)
  // ============================================
  CHAT_ROOM_NOT_FOUND: {
    code: 'CHAT_001',
    message: '채팅방을 찾을 수 없습니다.',
  },
  CHAT_FORBIDDEN: {
    code: 'CHAT_002',
    message: '채팅방에 접근할 권한이 없습니다.',
  },
  CHAT_SELF_CHAT: {
    code: 'CHAT_003',
    message: '자기 자신과 채팅을 시작할 수 없습니다.',
  },
  CHAT_FAILED_RETRIEVE: {
    code: 'CHAT_004',
    message: '채팅방 정보를 불러오는데 실패했습니다.',
  },
  CHAT_ALREADY_LEFT: {
    code: 'CHAT_005',
    message: '이미 나간 채팅방입니다.',
  },

  // ============================================
  // 위시리스트 관련 에러 (WISHLIST)
  // ============================================
  WISHLIST_NOT_FOUND: {
    code: 'WISHLIST_001',
    message: '위시리스트 항목을 찾을 수 없습니다.',
  },
  WISHLIST_INVALID_STATUS: {
    code: 'WISHLIST_002',
    message: '판매 중인 상품만 위시리스트에 추가할 수 있습니다.',
  },

  // ============================================
  // 검증 에러 (VALIDATION)
  // ============================================
  VALIDATION_ERROR: {
    code: 'VALIDATION_001',
    message: '입력값이 올바르지 않습니다.',
  },

  // ============================================
  // 서버 내부 에러 (INTERNAL)
  // ============================================
  INTERNAL_ERROR: {
    code: 'INTERNAL_001',
    message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
  EXTERNAL_API_ERROR: {
    code: 'INTERNAL_002',
    message: '외부 서비스 연동 중 오류가 발생했습니다.',
  },
} as const;

/**
 * 에러 코드 타입
 * ERROR_CODES 객체의 키 값들로 구성된 유니온 타입
 */
export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * 에러 정보 타입
 * code와 message를 포함하는 객체
 */
export type ErrorInfo = (typeof ERROR_CODES)[ErrorCode];
