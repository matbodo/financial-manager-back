"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres"),
    email: zod_1.z.string().trim().email("Formato de e-mail inválido"),
    password: zod_1.z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email("Formato de e-mail inválido"),
    password: zod_1.z.string().min(6, "A senha é obrgatória"),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, "O refresh token é obrigatório"),
});
