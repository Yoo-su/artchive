export interface JwtPayload {
  sub: number;
  nickname: string;
  role: 'USER' | 'ADMIN';
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}
