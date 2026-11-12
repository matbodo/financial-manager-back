"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres"),
    email: zod_1.z.string().trim().email("Formato de e-mail inválido"),
    password: zod_1.z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email("Formato de e-mail inválido"),
    password: zod_1.z
        .string()
        .min(6, "A senha é obrgatória e deve ter no mínimo 6 caracteres"),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, "O refresh token é obrigatório"),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email("Formato de e-mail inválido"),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "O token é obrigatório"),
    password: zod_1.z
        .string()
        .min(6, "A A nova senha deve ter pelo menos 6 caracteres"),
});
