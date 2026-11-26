"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesController = void 0;
const server_js_1 = require("../server.js");
const expenseSchema_js_1 = require("../schemas/expenseSchema.js");
const buildListQuery_js_1 = require("../utils/buildListQuery.js");
exports.ExpensesController = {
    async create(req, res) {
        try {
            const validation = expenseSchema_js_1.createExpenseSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    message: "Dados inválidos",
                    errors: validation.error.flatten().fieldErrors,
                });
            }
            const { name, value, date, category_id, account_id } = validation.data;
            const userId = req.user.id;
            if (account_id) {
                const accountExists = await server_js_1.prisma.account.findFirst({
                    where: { id: account_id, user_id: userId },
                });
                if (!accountExists) {
                    return res.status(404).json({ message: "Conta não encontrada" });
                }
            }
            const expense = await server_js_1.prisma.$transaction(async (tx) => {
                const created = await tx.expense.create({
                    data: {
                        name,
                        value,
                        date: date ? new Date(date) : new Date(),
                        category_id: category_id ?? null,
                        account_id: account_id ?? null,
                        user_id: req.user.id,
                    },
                    include: {
                        category: true,
                        account: true,
                    },
                });
                if (account_id) {
                    await tx.account.update({
                        where: { id: account_id },
                        data: {
                            balance: { decrement: value },
                        },
                    });
                }
                return created;
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
            const query = (0, buildListQuery_js_1.buildListQuery)(req, {
                userId: req.user.id,
                allowSortFields: ["date", "created_at", "value", "name"],
                dateField: "date",
            });
            const [expenses, totalItems] = await Promise.all([
                server_js_1.prisma.expense.findMany({
                    where: query.where,
                    skip: query.skip,
                    take: query.take,
                    orderBy: query.orderBy,
                    include: { category: true },
                }),
                server_js_1.prisma.expense.count({ where: query.where }),
            ]);
            return res
                .status(200)
                .json((0, buildListQuery_js_1.formatPaginationResponse)(expenses, totalItems, query.pagination.page, query.pagination.limit));
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async update(req, res) {
        try {
            const gastoId = Number(req.params.id);
            const userId = req.user.id;
            if (Number.isNaN(gastoId)) {
                return res.status(400).json({ message: "ID de gasto inválido" });
            }
            const validation = expenseSchema_js_1.updateExpenseSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    message: "Dados inválidos",
                    errors: validation.error.flatten().fieldErrors,
                });
            }
            const gastoExisting = await server_js_1.prisma.expense.findFirst({
                where: {
                    id: gastoId,
                    user_id: userId,
                },
            });
            if (!gastoExisting) {
                return res.status(404).json({ message: "Gasto não encontrado" });
            }
            const { name, value, date, category_id, account_id } = validation.data;
            if (account_id) {
                const accountExists = await server_js_1.prisma.account.findFirst({
                    where: {
                        id: account_id,
                        user_id: userId,
                    },
                });
                if (!accountExists) {
                    return res.status(404).json({ message: "Conta não encontrada" });
                }
            }
            const finalValue = value !== undefined ? value : Number(gastoExisting.value);
            const finalAccountId = account_id !== undefined ? account_id : gastoExisting.account_id;
            const gastoUpdated = await server_js_1.prisma.$transaction(async (tx) => {
                if (gastoExisting.account_id) {
                    await tx.account.update({
                        where: { id: gastoExisting.account_id },
                        data: {
                            balance: { increment: gastoExisting.value },
                        },
                    });
                }
                const updated = await tx.expense.update({
                    where: {
                        id: gastoExisting.id,
                    },
                    data: {
                        ...(name !== undefined && { name }),
                        ...(value !== undefined && { value }),
                        ...(date !== undefined && { date: new Date(date) }),
                        ...(category_id !== undefined && { category_id }),
                        ...(account_id !== undefined && { account_id }),
                    },
                    include: {
                        category: true,
                        account: true,
                    },
                });
                if (finalAccountId) {
                    await tx.account.update({
                        where: { id: finalAccountId },
                        data: {
                            balance: { decrement: finalValue },
                        },
                    });
                }
                return updated;
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
            await server_js_1.prisma.$transaction(async (tx) => {
                if (gasto.account_id) {
                    await tx.account.update({
                        where: { id: gasto.account_id },
                        data: {
                            balance: { increment: gasto.value },
                        },
                    });
                }
                await server_js_1.prisma.expense.delete({
                    where: {
                        id: gasto.id,
                    },
                });
            });
            return res.status(200).json({ message: "Gasto deletado com sucesso" });
        }
        catch (error) {
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
};
