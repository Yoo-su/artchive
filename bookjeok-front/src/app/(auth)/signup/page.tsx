import { Metadata } from "next";

import { GuestGuard } from "@/features/auth/components/guards/guest-guard";
import { DefaultLayout } from "@/layouts/default-layout";
import { SignupView } from "@/views/signup-view";

export const metadata: Metadata = {
  title: "회원가입",
  description: "북적에 가입하고 독서 기록을 시작해보세요.",
};

export default function SignupPage() {
  return (
    <GuestGuard>
      <DefaultLayout>
        <SignupView />
      </DefaultLayout>
    </GuestGuard>
  );
}
