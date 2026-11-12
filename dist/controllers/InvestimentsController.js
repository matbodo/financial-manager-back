"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestimentsController = void 0;
const server_js_1 = require("../server.js");
const investimentSchema_js_1 = require("../schemas/investimentSchema.js");
exports.InvestimentsController = {
    async create(req, res) {
        try {
            const validation = investimentSchema_js_1.createInvestimentSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    message: "Dados inválidos",
                    errors: validation.error.flatten().fieldErrors,
                });
            }
            const { name, value, date } = validation.data;
            const investiments = await server_js_1.prisma.investment.create({
                data: {
                    name,
                    value,
                    date: date ? new Date(date) : new Date(),
                    user_id: req.user.id,
                },
            });
            return res.status(201).json(investiments);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async list(req, res) {
        try {
            const investiments = await server_js_1.prisma.investment.findMany({
                where: {
                    user_id: req.user.id,
                },
            });
            return res.status(200).json(investiments);
        }
        catch (error) {
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async update(req, res) {
        try {
            const investimentId = Number(req.params.id);
            if (Number.isNaN(investimentId)) {
                return res.status(400).json({
                    message: "ID de investimento inválido",
                });
            }
            const validation = investimentSchema_js_1.updateInvestimentSchema.safeParse(req.params.id);
            if (!validation.success) {
                return res.status(400).json({
                    message: "Dados inválidos",
                    errors: validation.error.flatten().fieldErrors,
                });
            }
            const investimentExisting = await server_js_1.prisma.investment.findFirst({
                where: {
                    id: investimentId,
                    user_id: req.user.id,
                },
            });
            if (!investimentExisting) {
                return res.status(404).json({ message: "Investimento não encontrado" });
            }
            const { name, value, date } = validation.data;
            const investimentUpdated = await server_js_1.prisma.investment.update({
                where: {
                    id: investimentExisting.id,
                },
                data: {
                    ...(name !== undefined && { name }),
                    ...(value !== undefined && { value }),
                    ...(date !== undefined && { date: new Date(date) }),
                },
            });
            return res.status(200).json(investimentUpdated);
        }
        catch (error) {
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async delete(req, res) {
        try {
            const investimentId = Number(req.params.id);
            if (Number.isNaN(investimentId)) {
                return res.status(400).json({ message: "ID de gasto inválido" });
            }
            const investiment = await server_js_1.prisma.investment.findFirst({
                where: {
                    id: investimentId,
                    user_id: req.user.id,
                },
            });
            if (!investiment) {
                return res.status(404).json({ message: "Investimento não encontrado" });
            }
            await server_js_1.prisma.investment.delete({
                where: {
                    id: investiment.id,
                },
            });
            return res
                .status(200)
                .json({ message: "Investimento deletado com sucesso" });
        }
        catch (error) {
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
};
