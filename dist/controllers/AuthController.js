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
        const { email, password } = req.body;
        if (!email.trim() || !password.trim()) {
            return res
                .status(400)
                .json({ message: "Email e senha são obrigatórios" });
        }
        const user = await server_js_1.prisma.user.findFirst({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Email ou senha inválidos" });
        }
        const passwordMath = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMath) {
            return res.status(401).json({ message: "Email ou senha inválidos" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
        return res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                income: user.income,
            },
        });
    },
    async register(req, res) {
        const { name, email, password } = req.body;
        if (!name?.trim() || !email?.trim() || !password.trim()) {
            return res.status(401).json({
                message: "Nome, email e senha são obrigatórios",
            });
        }
        if (password.length < 8) {
            return res.status(401).json({
                message: "A senha deve conter pelo menos 8 caracteres",
            });
        }
        const existingUser = await server_js_1.prisma.user.findFirst({
            where: {
                email,
            },
        });
        if (existingUser) {
            return res.status(401).json({
                message: "Email já cadastrado",
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(req.body.password, 10);
        const user = await server_js_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
        return res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                income: user.income,
            },
        });
    },
};
