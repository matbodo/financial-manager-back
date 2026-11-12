"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GastosController = void 0;
const server_js_1 = require("../server.js");
const gastoSchema_js_1 = require("../schemas/gastoSchema.js");
exports.GastosController = {
    async create(req, res) {
        try {
            const validation = gastoSchema_js_1.createGastoSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    message: "Dados inválidos",
                    errors: validation.error.flatten().fieldErrors,
                });
            }
            const { name, value, date } = validation.data;
            const expense = await server_js_1.prisma.expense.create({
                data: {
                    name,
                    value,
                    date: date ? new Date(date) : new Date(),
                    user_id: req.user.id,
                },
            });
            return res.status(201).json(expense);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async list(req, res) {
        try {
            const expense = await server_js_1.prisma.expense.findMany({
                where: {
                    user_id: req.user.id,
                },
            });
            return res.status(200).json(expense);
        }
        catch (error) {
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async update(req, res) {
        try {
            const gastoId = Number(req.params.id);
            if (Number.isNaN(gastoId)) {
                return res.status(400).json({ message: "ID de gasto inválido" });
            }
            const validation = gastoSchema_js_1.updateGastoSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    message: "Dados inválidos",
                    errors: validation.error.flatten().fieldErrors,
                });
            }
            const gastoExisting = await server_js_1.prisma.expense.findFirst({
                where: {
                    id: gastoId,
                    user_id: req.user.id,
                },
            });
            if (!gastoExisting) {
                return res.status(404).json({ message: "Gasto não encontrado" });
            }
            const { name, value, date } = validation.data;
            const gastoUpdated = await server_js_1.prisma.expense.update({
                where: {
                    id: gastoExisting.id,
                },
                data: {
                    ...(name !== undefined && { name }),
                    ...(value !== undefined && { value }),
                    ...(date !== undefined && { date: new Date(date) }),
                },
            });
            return res.status(200).json(gastoUpdated);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async delete(req, res) {
        try {
            const gastoId = Number(req.params.id);
            if (Number.isNaN(gastoId)) {
                return res.status(400).json({ message: "ID de gasto inválido" });
            }
            const gasto = await server_js_1.prisma.expense.findFirst({
                where: {
                    id: Number(req.params.id),
                    user_id: req.user.id,
                },
            });
            if (!gasto) {
                return res.status(404).json({ message: "Gasto não encontrado" });
            }
            await server_js_1.prisma.expense.delete({
                where: {
                    id: gasto.id,
                },
            });
            return res.status(200).json({ message: "Gasto deletado com sucesso" });
        }
        catch (error) {
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
};
