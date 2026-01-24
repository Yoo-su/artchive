"use client";

import { SignupForm } from "@/features/auth/components/forms/signup-form";

export const SignupView = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <SignupForm />
    </div>
  );
};
