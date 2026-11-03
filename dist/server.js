"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const routes_js_1 = require("./routes.js");
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não configurado");
}
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurado");
}
const databaseUrl = new URL(process.env.DATABASE_URL);
const adapter = new adapter_mariadb_1.PrismaMariaDb({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.slice(1),
    connectionLimit: 5,
});
const prisma = new client_1.PrismaClient({ adapter });
exports.prisma = prisma;
const app = (0, express_1.default)();
const FRONTEND_URL = "https://financial-manager-dusky.vercel.app";
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
}));
app.use(routes_js_1.router);
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
