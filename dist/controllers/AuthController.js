"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const server_js_1 = require("../server.js");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
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
            const refresToken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.REFRESH_JWT_SECRET, { expiresIn: "7d" });
            return res.status(200).json({
                token,
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
            const refresToken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.REFRESH_JWT_SECRET, { expiresIn: "7d" });
            return res.status(201).json({
                token,
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
            const decode = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = await server_js_1.prisma.user.findUnique({
                where: { id: decode.id },
            });
            if (!user) {
                return res.status(401).json({ message: "Usuário não encontrado" });
            }
            const newToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
            return res.status(200).json({ token: newToken });
        }
        catch (error) {
            return res
                .status(401)
                .json({ message: "Refresh token inválido ou expirado" });
        }
    },
};
