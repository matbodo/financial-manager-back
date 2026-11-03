"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const server_1 = require("../server");
exports.UserController = {
    async updateIncome(req, res) {
        const income = Number(req.body.income);
        if (Number.isNaN(income) || income < 0) {
            return res
                .status(400)
                .json({ message: "Renda deve ser um número positivo" });
        }
        const user = await server_1.prisma.user.update({
            where: { id: req.user.id },
            data: { income: income },
        });
        return res.status(200).json(user);
    },
    async getSummary(req, res) {
        const userId = req.user.id;
        const user = await server_1.prisma.user.findUnique({ where: { id: userId } });
        const assinaturas = await server_1.prisma.assinaturas.aggregate({
            where: { user_id: userId },
            _sum: { value: true },
        });
        const investimentos = await server_1.prisma.investimentos.aggregate({
            where: { user_id: userId },
            _sum: { value: true },
        });
        const gastos = await server_1.prisma.gastos.aggregate({
            where: { user_id: userId },
            _sum: { value: true },
        });
        const income = Number(user?.income) || 0;
        const assinaturasTotal = Number(assinaturas._sum.value) || 0;
        const investimentosTotal = Number(investimentos._sum.value) || 0;
        const gastosTotal = Number(gastos._sum.value) || 0;
        return res.status(200).json({
            income,
            assinaturas: assinaturasTotal,
            investimentos: investimentosTotal,
            gastos: gastosTotal,
            totalGeral: assinaturasTotal + investimentosTotal + gastosTotal,
        });
    },
};
