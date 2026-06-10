import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  name: z.string().min(2).max(100),
  companyName: z.string().min(2).max(200),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-().]{7,20}$/)
    .optional(),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
