"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const server_js_1 = require("../server.js");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const sendEmail_js_1 = require("../utils/sendEmail.js");
async function generateAndSaveRefreshToken(userId) {
    const refreshToken = jsonwebtoken_1.default.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await server_js_1.prisma.refreshToken.create({
        data: {
            token: refreshToken,
            user_id: userId,
            expiresAt,
        },
    });
    return refreshToken;
}
exports.AuthController = {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await server_js_1.prisma.user.findFirst({ where: { email } });
            if (!user) {
                return res.status(401).json({ message: "Email ou senha inválidos" });
            }
            const passwordMath = await bcrypt_1.default.compare(password, user.password);
            if (!passwordMath) {
                return res.status(401).json({ message: "Email ou senha inválidos" });
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
            const refreshToken = await generateAndSaveRefreshToken(user.id);
            return res.status(200).json({
                token,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    income: user.income,
                },
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async register(req, res) {
        try {
            const { name, email, password } = req.body;
            const userExists = await server_js_1.prisma.user.findUnique({ where: { email } });
            if (userExists) {
                return res.status(409).json({ message: "Email já cadastrado" });
            }
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            const user = await server_js_1.prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                },
            });
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
            const refreshToken = await generateAndSaveRefreshToken(user.id);
            return res.status(201).json({
                token,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    income: user.income,
                },
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            // 1. Verifica se a assinatura JWT é válida
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            // 2. Busca o token no banco de dados
            const storedToken = await server_js_1.prisma.refreshToken.findUnique({
                where: { token: refreshToken },
            });
            if (!storedToken) {
                return res
                    .status(401)
                    .json({ message: "Refresh token inválido ou revogado" });
            }
            // 3. Remove o token antigo (Rotação de Refresh Token)
            await server_js_1.prisma.refreshToken.delete({
                where: { id: storedToken.id },
            });
            // 4. Busca o usuário
            const user = await server_js_1.prisma.user.findUnique({
                where: { id: decoded.id },
            });
            if (!user) {
                return res.status(401).json({ message: "Usuário não encontrado" });
            }
            // 5. Emite um novo Access Token e um novo Refresh Token
            const newToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
            const newRefreshToken = await generateAndSaveRefreshToken(user.id);
            return res.status(200).json({
                token: newToken,
                refreshToken: newRefreshToken,
            });
        }
        catch (error) {
            console.error(error);
            return res
                .status(401)
                .json({ message: "Refresh token inválido ou expirado" });
        }
    },
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                await server_js_1.prisma.refreshToken.deleteMany({
                    where: { token: refreshToken },
                });
            }
            return res.status(200).json({ message: "Logout realizado com sucesso" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao realizar logout" });
        }
    },
    async forgortPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await server_js_1.prisma.user.findUnique({ where: email });
            if (!user) {
                return res.status(200).json({
                    message: "Se o e-mail for valido, um link de recuperação foi enviado.",
                });
            }
            const resetToken = crypto_1.default.randomBytes(32).toString("hex");
            const resetTokenExpires = new Date();
            resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);
            await server_js_1.prisma.user.update({
                where: { id: email.id },
                data: {
                    resetToken,
                    resetTokenExpires,
                },
            });
            const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
            await (0, sendEmail_js_1.sendEmail)({
                to: user.email,
                subject: "Recuperação de senha",
                html: `<h3>Você solicitou a recuperação de senha</h3>
          <p>Clique no link abaixo para redefinir sua senha. Este link é válido por 1 hora.</p>
          <a href="${resetUrl}" target="_blank">Redefinir Senha</a>
          <br/><br/>
          <p>Se você não solicitou isso, ignore este e-mail.</p>
          `,
            });
            return res.status(200).json({
                message: "Se o e-mail existir, um link de recuperação foi enviado.",
            });
        }
        catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ message: "Erro ao tentar enviar e-mail de recuperação" });
        }
    },
};
