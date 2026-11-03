"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Token de autenticação ausente" });
    }
    const [, token] = authHeader.split(" ");
    try {
        const secret = process.env.JWT_SECRET ?? "fallback_secret";
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        return next();
    }
    catch (error) {
        return res.status(401).json({ message: "Token de autenticação inválido" });
    }
}
