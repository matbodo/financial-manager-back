"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesController = void 0;
const node_crypto_1 = require("node:crypto");
const server_js_1 = require("../server.js");
const expenseSchema_js_1 = require("../schemas/expenseSchema.js");
const buildListQuery_js_1 = require("../utils/buildListQuery.js");
const installmentHelper_js_1 = require("../utils/installmentHelper.js");
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
            const { name, value, date, category_id, account_id, credit_card_id, installments, } = validation.data;
            const userId = req.user.id;
            const purchaseDate = date ? new Date(date) : new Date();
            if (credit_card_id) {
                const card = await server_js_1.prisma.creditCard.findFirst({
                    where: { id: credit_card_id, user_id: userId },
                });
                if (!card) {
                    return res
                        .status(404)
                        .json({ message: "Cartão de credito não encontrado" });
                }
                const startPeriod = (0, installmentHelper_js_1.getStartingInvoicePeriod)(purchaseDate, card.closing_day);
                const installmentValues = (0, installmentHelper_js_1.splitInstallments)(value, installments);
                const groupId = installments > 1 ? (0, node_crypto_1.randomUUID)() : null;
                const createdExpenses = await server_js_1.prisma.$transaction(async (tx) => {
                    // 1. Prepara os dados de cada mês e cria/atualiza todas as faturas em paralelo (1 viagem de rede)
                    const invoices = await Promise.all(Array.from({ length: installments }, (_, i) => {
                        const { month, year } = (0, installmentHelper_js_1.addMonthsToPeriod)(startPeriod.month, startPeriod.year, i);
                        const installmentValue = installmentValues[i];
                        const closingDate = (0, installmentHelper_js_1.getClampedDate)(year, month, card.closing_day);
                        const dueDate = (0, installmentHelper_js_1.getClampedDate)(year, month, card.due_day);
                        return tx.invoice.upsert({
                            where: {
                                credit_card_id_month_year: {
                                    credit_card_id: card.id,
                                    month,
                                    year,
                                },
                            },
                            update: {
                                total_amount: { increment: installmentValue },
                            },
                            create: {
                                credit_card_id: card.id,
                                month,
                                year,
                                closing_date: closingDate,
                                due_date: dueDate,
                                total_amount: installmentValue,
                                status: "OPEN",
                            },
                        });
                    }));
                    // 2. Insere todas as parcelas em um único INSERT no MySQL (1 viagem de rede)
                    const expensesData = invoices.map((invoice, i) => ({
                        name: installments > 1 ? `${name} (${i + 1}/${installments})` : name,
                        value: installmentValues[i],
                        date: purchaseDate,
                        category_id: category_id ?? null,
                        invoice_id: invoice.id,
                        installment_group_id: groupId,
                        installment_number: installments > 1 ? i + 1 : null,
                        total_installments: installments > 1 ? installments : null,
                        user_id: userId,
                    }));
                    await tx.expense.createMany({
                        data: expensesData,
                    });
                    return expensesData;
                }, {
                    maxWait: 10000,
                    timeout: 15000,
                });
                return res.status(201).json({
                    installment_group_id: groupId,
                    total_installments: installments,
                    expenses: createdExpenses,
                });
            }
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
                else if (gastoExisting.invoice_id) {
                    await tx.invoice.update({
                        where: { id: gastoExisting.invoice_id },
                        data: { total_amount: { decrement: gastoExisting.value } },
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
                        invoice: true,
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
                else if (gastoExisting.invoice_id) {
                    await tx.invoice.update({
                        where: { id: gastoExisting.invoice_id },
                        data: { total_amount: { increment: finalValue } },
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
                else if (gasto.invoice_id) {
                    await tx.invoice.update({
                        where: { id: gasto.invoice_id },
                        data: { total_amount: { decrement: gasto.value } },
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
    async deleteInstallmentGroup(req, res) {
        try {
            const rawGroupId = req.params.groupId;
            const groupId = Array.isArray(rawGroupId) ? rawGroupId[0] : rawGroupId;
            const userId = req.user.id;
            if (!groupId) {
                return res.status(400).json({ message: "ID de parcelamento inválido" });
            }
            const installments = await server_js_1.prisma.expense.findMany({
                where: {
                    installment_group_id: groupId,
                    user_id: userId,
                },
                include: { invoice: true },
            });
            if (installments.length === 0) {
                return res.status(404).json({ message: "Parcelamento não encontrado" });
            }
            const hasPaidInvoice = installments.some((item) => item.invoice?.status === "PAID");
            if (hasPaidInvoice) {
                return res.status(400).json({
                    message: "Não é possível excluir um parcelamento que já possui faturas pagas",
                });
            }
            await server_js_1.prisma.$transaction(async (tx) => {
                for (const item of installments) {
                    if (item.invoice_id) {
                        await tx.invoice.update({
                            where: { id: item.invoice_id },
                            data: { total_amount: { decrement: item.value } },
                        });
                    }
                }
                await tx.expense.deleteMany({
                    where: { installment_group_id: groupId, user_id: userId },
                });
            });
            return res.status(200).json({
                message: "Parcelamento cancelado e faturas estornadas com sucesso",
                deletedCount: installments.length,
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
};
