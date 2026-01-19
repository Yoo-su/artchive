import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_KAKAO_APP_KEY: z.string().min(1),
  NEXT_PUBLIC_GOOGLE_ADSENSE_ID: z.string().optional(),
});

const processEnv = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_KAKAO_APP_KEY: process.env.NEXT_PUBLIC_KAKAO_APP_KEY,
  NEXT_PUBLIC_GOOGLE_ADSENSE_ID: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID,
};

// 런타임 환경 변수 검증
const parsedEnv = envSchema.safeParse(processEnv);

if (!parsedEnv.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsedEnv.error.flatten().fieldErrors,
  );
  // 프로덕션에서는 에러를 던져서 배포 중단시킬 수도 있음
  // throw new Error("Invalid environment variables");
}

export const config = parsedEnv.success
  ? parsedEnv.data
  : {
      NEXT_PUBLIC_API_URL: "",
      NEXT_PUBLIC_KAKAO_APP_KEY: "",
      NEXT_PUBLIC_GOOGLE_ADSENSE_ID: "",
      // Fallback values to prevent crash if env is missing (for dev)
    };
