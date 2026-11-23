"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryController = void 0;
const server_js_1 = require("../server.js");
exports.SummaryController = {
    async analytical(req, res) {
        try {
            const userId = req.user.id;
            const now = new Date();
            const spDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const month = Number(req.query.month) || spDate.getMonth() + 1;
            const year = Number(req.query.year) || spDate.getFullYear();
            const startOfCurrentMonth = new Date(year, month - 1, 1, 0, 0, 0);
            const endOfCurrentMonth = new Date(year, month, 0, 23, 59, 59, 999);
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevYear = month === 1 ? year - 1 : year;
            const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1, 0, 0, 0);
            const endOfPrevMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);
            const [currentExpenses, prevExpensesAgg, currentInvestmentsAgg, activeSignaturesAgg, budgets,] = await Promise.all([
                server_js_1.prisma.expense.findMany({
                    where: {
                        user_id: userId,
                        date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
                    },
                    include: { category: true },
                }),
                server_js_1.prisma.expense.aggregate({
                    where: {
                        user_id: userId,
                        date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
                    },
                    _sum: { value: true },
                }),
                server_js_1.prisma.investment.aggregate({
                    where: {
                        user_id: userId,
                        date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
                    },
                    _sum: { value: true },
                }),
                server_js_1.prisma.signature.aggregate({
                    where: {
                        user_id: userId,
                        active: true,
                    },
                    _sum: { value: true },
                    _count: { id: true },
                }),
                server_js_1.prisma.budget.findMany({
                    where: {
                        user_id: userId,
                        month,
                        year,
                    },
                }),
            ]);
            const totalExpenses = currentExpenses.reduce((acc, item) => acc + Number(item.value), 0);
            const prevTotalExpenses = Number(prevExpensesAgg._sum.value || 0);
            const totalInvestments = Number(currentInvestmentsAgg._sum.value || 0);
            const totalActiveSubscriptions = Number(activeSignaturesAgg._sum.value || 0);
            const totalOutflow = totalExpenses + totalInvestments;
            const investmentRate = totalOutflow > 0
                ? Number(((totalInvestments / totalOutflow) * 100).toFixed(2))
                : 0;
            let expenseVariationPercentage = 0;
            if (prevTotalExpenses > 0) {
                expenseVariationPercentage = Number((((totalExpenses - prevTotalExpenses) / prevTotalExpenses) *
                    100).toFixed(2));
            }
            const categoryMap = new Map();
            for (const expense of currentExpenses) {
                const key = expense.category_id
                    ? String(expense.category_id)
                    : "sem-categoria";
                const current = categoryMap.get(key) || {
                    categoryId: expense.category_id,
                    categoryName: expense.category?.name || "Sem categoria",
                    color: expense.category?.color || "#9ca3af",
                    total: 0,
                    count: 0,
                };
                current.total += Number(expense.value);
                current.count += 1;
                categoryMap.set(key, current);
            }
            const expensesByCategory = Array.from(categoryMap.values())
                .map((item) => ({
                ...item,
                total: Number(item.total.toFixed(2)),
                percentageOfTotal: totalExpenses > 0
                    ? Number(((item.total / totalExpenses) * 100).toFixed(2))
                    : 0,
            }))
                .sort((a, b) => b.total - a.total);
            const totalBudgetLimit = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
            return res.status(200).json({
                period: { month, year },
                totals: {
                    expenses: Number(totalExpenses.toFixed(2)),
                    investments: Number(totalInvestments.toFixed(2)),
                    activeSubscriptions: Number(totalActiveSubscriptions.toFixed(2)),
                    activeSubscriptionsCount: activeSignaturesAgg._count.id,
                    investmentRate,
                },
                comparison: {
                    previousMonth: { month: prevMonth, year: prevYear },
                    previousMonthExpenses: Number(prevTotalExpenses.toFixed(2)),
                    expenseVariationPercentage,
                },
                budgetsOverview: {
                    totalPlanned: Number(totalBudgetLimit.toFixed(2)),
                    remainingOverall: Number((totalBudgetLimit - totalExpenses).toFixed(2)),
                },
                expensesByCategory,
            });
        }
        catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ message: "Erro ao gerar resumo analítico" });
        }
    },
    async categoryChart(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate, month, year } = req.query;
            let dateFilter;
            if (startDate && endDate) {
                dateFilter = {
                    gte: new Date(`${startDate}T00:00:00.000Z`),
                    lte: new Date(`${endDate}T23:59:59.999Z`),
                };
            }
            else {
                const now = new Date();
                const spDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
                const targetMonth = Number(month) || spDate.getMonth() + 1;
                const targetYear = Number(year) || spDate.getFullYear();
                dateFilter = {
                    gte: new Date(targetYear, targetMonth - 1, 1, 0, 0, 0),
                    lte: new Date(targetYear, targetMonth, 0, 23, 59, 59, 999),
                };
            }
            const groupedExpenses = await server_js_1.prisma.expense.groupBy({
                by: ["category_id"],
                where: {
                    user_id: userId,
                    date: dateFilter,
                },
                _sum: {
                    value: true,
                },
                _count: {
                    id: true,
                },
                orderBy: {
                    _sum: {
                        value: "desc",
                    },
                },
            });
            const categories = await server_js_1.prisma.category.findMany({
                where: { user_id: userId },
                select: { id: true, name: true, color: true },
            });
            const categoryInfoMap = new Map(categories.map((cat) => [cat.id, { name: cat.name, color: cat.color }]));
            const totalAmount = groupedExpenses.reduce((acc, item) => acc + Number(item._sum.value || 0), 0);
            const chartData = groupedExpenses.map((item) => {
                const value = Number(item._sum.value || 0);
                const info = item.category_id
                    ? categoryInfoMap.get(item.category_id)
                    : null;
                return {
                    categoryId: item.category_id,
                    name: info?.name || "Sem categoria",
                    value: Number(value.toFixed(2)),
                    color: info?.color || "#9ca3af",
                    percentage: totalAmount > 0
                        ? Number(((value / totalAmount) * 100).toFixed(2))
                        : 0,
                    count: item._count.id,
                };
            });
            return res.status(200).json({
                total: Number(totalAmount.toFixed(2)),
                slicesCount: chartData.length,
                data: chartData,
            });
        }
        catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ message: "Erro ao agrupar gastos por categoria" });
        }
    },
    async patrimonyEvolution(req, res) {
        try {
            const userId = req.user.id;
            const now = new Date();
            const spDate = new Date(now.toLocaleDateString("en-US", { timeZone: "America/Sao_Paulo" }));
            const currentMonth = spDate.getMonth();
            const currentYear = spDate.getFullYear();
            const monthsWindow = [];
            const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
                month: "short",
            });
            for (let i = 5; i >= 0; i--) {
                const targetDate = new Date(currentYear, currentMonth - i, 1);
                const m = targetDate.getMonth();
                const y = targetDate.getFullYear();
                const rawMonth = monthFormatter.format(targetDate).replace(".", "");
                const captalizedMonth = rawMonth.charAt(0).toUpperCase + rawMonth.slice(1);
                monthsWindow.push({
                    month: m + 1,
                    year: y,
                    label: `${captalizedMonth}/${String(y).slice(-2)}`,
                    startDate: new Date(y, m, 1, 0, 0, 0),
                    endDate: new Date(y, m + 1, 0, 23, 59, 59, 999),
                });
            }
            const windowStart = monthsWindow[0].startDate;
            const windowEnd = monthsWindow[monthsWindow.length - 1].endDate;
            const [previousInvestmentsAgg, windowInvestments, windowExpenses] = await Promise.all([
                server_js_1.prisma.investment.aggregate({
                    where: {
                        user_id: userId,
                        date: { lt: windowStart },
                    },
                    _sum: { value: true },
                }),
                server_js_1.prisma.investment.findMany({
                    where: {
                        user_id: userId,
                        date: { gte: windowStart, lte: windowEnd },
                    },
                    select: { value: true, date: true },
                }),
                server_js_1.prisma.expense.findMany({
                    where: {
                        user_id: userId,
                        date: { gte: windowStart, lte: windowEnd },
                    },
                    select: { value: true, date: true },
                }),
            ]);
            let accumulatedPatrimony = Number(previousInvestmentsAgg._sum.value || 0);
            const evolution = monthsWindow.map((item) => {
                const monthlyInvested = windowInvestments
                    .filter((inv) => {
                    if (!inv.date)
                        return false;
                    const d = new Date(inv.date);
                    return d >= item.startDate && d <= item.endDate;
                })
                    .reduce((acc, inv) => acc + Number(inv.value), 0);
                const monthlyExpenses = windowExpenses
                    .filter((exp) => {
                    if (!exp.date)
                        return false;
                    const d = new Date(exp.date);
                    return d >= item.startDate && d <= item.endDate;
                })
                    .reduce((acc, exp) => acc + Number(exp.value), 0);
                accumulatedPatrimony += monthlyInvested;
                return {
                    month: item.month,
                    year: item.year,
                    label: item.label,
                    invested: Number(monthlyInvested.toFixed(2)),
                    expenses: Number(monthlyExpenses.toFixed(2)),
                    accumulatedPatrimony: Number(accumulatedPatrimony.toFixed(2)),
                };
            });
            const initialPatrimony = Number(previousInvestmentsAgg._sum.value || 0);
            const currentPatrimony = evolution[evolution.length - 1]?.accumulatedPatrimony || 0;
            return res.status(200).json({
                initialPatrimony: Number(initialPatrimony.toFixed(2)),
                currentPatrimony,
                periodGrowth: Number((currentPatrimony - initialPatrimony).toFixed(2)),
                data: evolution,
            });
        }
        catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ message: "Erro ao calcular evolução patrimonial" });
        }
    },
};
