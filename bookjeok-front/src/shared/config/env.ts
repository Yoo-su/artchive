import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_KAKAO_APP_KEY: z.string().min(1),
  NEXT_PUBLIC_GOOGLE_ADSENSE_ID: z.string().optional(),
});

const serverEnvSchema = z.object({
  NAVER_CLIENT_ID: z.string().min(1),
  NAVER_CLIENT_SECRET: z.string().min(1),
  CULTURE_SERVICE_KEY: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

const _clientEnv = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_KAKAO_APP_KEY: process.env.NEXT_PUBLIC_KAKAO_APP_KEY,
  NEXT_PUBLIC_GOOGLE_ADSENSE_ID: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID,
};

const _serverEnv = {
  NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET,
  CULTURE_SERVICE_KEY: process.env.CULTURE_SERVICE_KEY,
  NODE_ENV: process.env.NODE_ENV,
};

// 클라이언트 환경 변수 검증 (항상 수행)
const parsedClientEnv = clientEnvSchema.safeParse(_clientEnv);

if (!parsedClientEnv.success) {
  console.error(
    "❌ Invalid client environment variables:",
    parsedClientEnv.error.flatten().fieldErrors,
  );
  throw new Error("Invalid client environment variables");
}

// 서버 환경 변수 검증 (서버 사이드에서만 수행)
let parsedServerEnv = { success: true, data: _serverEnv } as any;
if (typeof window === "undefined") {
  parsedServerEnv = serverEnvSchema.safeParse(_serverEnv);
  if (!parsedServerEnv.success) {
    console.error(
      "❌ Invalid server environment variables:",
      parsedServerEnv.error.flatten().fieldErrors,
    );
    throw new Error("Invalid server environment variables");
  }
}

export const config = {
  ...parsedClientEnv.data,
  ...parsedServerEnv.data,
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
} as z.infer<typeof clientEnvSchema> &
  z.infer<typeof serverEnvSchema> & { isDev: boolean; isProd: boolean };
