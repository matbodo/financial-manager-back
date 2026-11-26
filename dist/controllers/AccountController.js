"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const zod_1 = require("zod");
const server_1 = require("../server");
const createAccountSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Nome da conta é obrigatório"),
    type: zod_1.z
        .enum(["CHECKING", "SAVINGS", "WALLET", "INVESTMENT"])
        .default("CHECKING"),
    balance: zod_1.z.coerce.number().default(0),
    color: zod_1.z.string().optional(),
});
const updateAccountSchema = createAccountSchema.partial();
exports.AccountController = {
    async create(req, res) {
        try {
            const userId = req.user.id;
            const data = createAccountSchema.parse(req.body);
            const account = await server_1.prisma.account.create({
                data: {
                    ...data,
                    user_id: userId,
                },
            });
            return res.status(201).json(account);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ message: error.issues });
            }
            console.error(error);
            return res.status(500).json({ message: "Erro ao criar conta" });
        }
    },
    async list(req, res) {
        try {
            const userId = req.user.id;
            const accounts = await server_1.prisma.account.findMany({
                where: { user_id: userId },
                orderBy: { created_at: "asc" },
            });
            const totalBalance = accounts.reduce((acc, item) => acc + Number(item.balance), 0);
            return res.status(200).json({
                totalBalance: Number(totalBalance.toFixed(2)),
                accounts,
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao listar contas" });
        }
    },
    async update(req, res) {
        try {
            const userId = req.user.id;
            const id = Number(req.params.id);
            const data = updateAccountSchema.parse(req.body);
            const existing = await server_1.prisma.account.findFirst({
                where: { id, user_id: userId },
            });
            if (!existing) {
                return res.status(404).json({ message: "Conta não encontrada" });
            }
            const updated = await server_1.prisma.account.update({
                where: { id },
                data,
            });
            return res.status(200).json(updated);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao atualizar conta" });
        }
    },
    async delete(req, res) {
        try {
            const userId = req.user.id;
            const id = Number(req.params.id);
            const existing = await server_1.prisma.account.findFirst({
                where: { id, user_id: userId },
            });
            if (!existing) {
                return res.status(404).json({ message: "Conta não encontrada" });
            }
            await server_1.prisma.account.delete({ where: { id } });
            return res.status(204).send();
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao excluir conta" });
        }
    },
};
