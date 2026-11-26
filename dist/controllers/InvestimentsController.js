"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestimentsController = void 0;
const server_js_1 = require("../server.js");
const investimentSchema_js_1 = require("../schemas/investimentSchema.js");
const buildListQuery_js_1 = require("../utils/buildListQuery.js");
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
            const { name, value, date, category_id, account_id } = validation.data;
            const userId = req.user.id;
            if (account_id) {
                const accountExisting = await server_js_1.prisma.account.findFirst({
                    where: { id: account_id, user_id: userId },
                });
                if (!accountExisting) {
                    return res.status(404).json({ message: "Conta não encontrada" });
                }
            }
            const investiments = await server_js_1.prisma.$transaction(async (tx) => {
                const createdInvestment = await tx.investment.create({
                    data: {
                        name,
                        value,
                        date: date ? new Date(date) : new Date(),
                        category_id: category_id ?? null,
                        account_id: account_id ?? null,
                        user_id: userId,
                    },
                });
                if (account_id) {
                    await tx.account.update({
                        where: { id: account_id },
                        data: {
                            balance: { increment: value },
                        },
                    });
                }
                return createdInvestment;
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
            const query = (0, buildListQuery_js_1.buildListQuery)(req, {
                userId: req.user.id,
                allowSortFields: ["date", "created_at", "value", "name"],
                dateField: "date",
            });
            const [investments, totalItems] = await Promise.all([
                server_js_1.prisma.investment.findMany({
                    where: query.where,
                    skip: query.skip,
                    take: query.take,
                    orderBy: query.orderBy,
                    include: { category: true },
                }),
                server_js_1.prisma.investment.count({ where: query.where }),
            ]);
            return res
                .status(200)
                .json((0, buildListQuery_js_1.formatPaginationResponse)(investments, totalItems, query.pagination.page, query.pagination.limit));
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async update(req, res) {
        try {
            const investimentId = Number(req.params.id);
            const userId = req.user.id;
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
                    user_id: userId,
                },
            });
            if (!investimentExisting) {
                return res.status(404).json({ message: "Investimento não encontrado" });
            }
            const { name, value, date, category_id, account_id } = validation.data;
            if (account_id) {
                const accountExisting = await server_js_1.prisma.account.findFirst({
                    where: { id: account_id, user_id: userId },
                });
                if (!accountExisting) {
                    return res.status(404).json({ message: "Conta nao encontrada" });
                }
            }
            const finalValue = value !== undefined ? value : Number(investimentExisting.value);
            const finalAccountId = account_id !== undefined ? account_id : investimentExisting.account_id;
            const investimentUpdated = await server_js_1.prisma.$transaction(async (tx) => {
                if (investimentExisting.account_id) {
                    await tx.account.update({
                        where: { id: investimentExisting.account_id },
                        data: {
                            balance: { decrement: investimentExisting.value },
                        },
                    });
                }
                const updated = await tx.investment.update({
                    where: {
                        id: investimentExisting.id,
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
                            balance: { increment: finalValue },
                        },
                    });
                }
                return updated;
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
            await server_js_1.prisma.$transaction(async (tx) => {
                if (investiment.account_id) {
                    await tx.account.update({
                        where: { id: investiment.account_id },
                        data: {
                            balance: { decrement: investiment.value },
                        },
                    });
                }
                await tx.investment.delete({
                    where: {
                        id: investiment.id,
                    },
                });
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
