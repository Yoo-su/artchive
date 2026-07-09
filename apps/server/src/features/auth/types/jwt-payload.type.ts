export interface JwtPayload {
  sub: number;
  nickname: string;
  role: 'USER' | 'ADMIN';
  iat?: number;
  exp?: number;
}
