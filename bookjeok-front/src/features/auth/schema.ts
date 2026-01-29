import { z } from "zod";

export const createSignupSchema = (t: (key: string) => string) =>
  z
    .object({
      email: z.string().email(t("email_invalid")),
      password: z
        .string()
        .min(8, t("password_min"))
        .regex(
          /^(?=.*[a-zA-Z])(?=.*[!@#$%^&*+=-])(?=.*[0-9]).{8,20}$/,
          t("password_regex"),
        ),
      passwordConfirm: z.string(),
      nickname: z.string().min(2, t("nickname_min")).max(10, t("nickname_max")),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: t("password_mismatch"),
      path: ["passwordConfirm"],
    });

export const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("email_invalid")),
    password: z.string().min(1, t("password_required")),
  });

// Schema Types (Use a dummy schema or infer from Zod directly, but since we need generic T, we can use ReturnType or just static inference if possible.
// Actually, types shouldn't depend on translation values.
// We can define a BASE schema for types or just use Zod helpers with `z.ZodType<...>`.
// Simplest way: Define the Shape separately? Or just instantiate one for type inference with dummy function.)
const dummyT = (k: string) => k;
export const SignupSchema = createSignupSchema(dummyT);
export const LoginSchema = createLoginSchema(dummyT);

export type SignupSchemaType = z.infer<typeof SignupSchema>;
export type LoginSchemaType = z.infer<typeof LoginSchema>;
