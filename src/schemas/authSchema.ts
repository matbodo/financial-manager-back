import { email, z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().trim().email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Formato de e-mail inválido"),
  password: z
    .string()
    .min(6, "A senha é obrgatória e deve ter no mínimo 6 caracteres"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "O refresh token é obrigatório"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Formato de e-mail inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "O token é obrigatório"),
  password: z
    .string()
    .min(6, "A A nova senha deve ter pelo menos 6 caracteres"),
});
