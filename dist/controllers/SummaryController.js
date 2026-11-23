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
            const month = Number(req.query.month) || spDate.getMonth() + 1; // 1 a 12
            const year = Number(req.query.year) || spDate.getFullYear();
            const startOfCurrentMonth = new Date(year, month - 1, 1, 0, 0, 0);
            const endOfCurrentMonth = new Date(year, month, 0, 23, 59, 59, 999);
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevYear = month === 1 ? year - 1 : year;
            const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1, 0, 0, 0);
            const endOfPrevMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);
            // 2. Busca todos os dados necessários em paralelo no banco
            const [currentExpenses, prevExpensesAgg, currentInvestmentsAgg, activeSignaturesAgg, budgets,] = await Promise.all([
                // Gastos detalhados do mês (com categoria para montar o gráfico)
                server_js_1.prisma.expense.findMany({
                    where: {
                        user_id: userId,
                        date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
                    },
                    include: { category: true },
                }),
                // Soma total dos gastos do mês anterior (usando aggregate direto no MySQL)
                server_js_1.prisma.expense.aggregate({
                    where: {
                        user_id: userId,
                        date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
                    },
                    _sum: { value: true },
                }),
                // Soma total dos investimentos no mês atual
                server_js_1.prisma.investment.aggregate({
                    where: {
                        user_id: userId,
                        date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
                    },
                    _sum: { value: true },
                }),
                // Custo fixo mensal de todas as assinaturas ativas
                server_js_1.prisma.signature.aggregate({
                    where: {
                        user_id: userId,
                        active: true,
                    },
                    _sum: { value: true },
                    _count: { id: true },
                }),
                // Orçamentos definidos para o mês
                server_js_1.prisma.budget.findMany({
                    where: {
                        user_id: userId,
                        month,
                        year,
                    },
                }),
            ]);
            // 3. Cálculos dos totais (convertendo Decimal do Prisma para Number)
            const totalExpenses = currentExpenses.reduce((acc, item) => acc + Number(item.value), 0);
            const prevTotalExpenses = Number(prevExpensesAgg._sum.value || 0);
            const totalInvestments = Number(currentInvestmentsAgg._sum.value || 0);
            const totalActiveSubscriptions = Number(activeSignaturesAgg._sum.value || 0);
            // Taxa de poupança/investimento sobre o total movimentado no mês
            const totalOutflow = totalExpenses + totalInvestments;
            const investmentRate = totalOutflow > 0
                ? Number(((totalInvestments / totalOutflow) * 100).toFixed(2))
                : 0;
            // 4. Variação percentual de gastos comparado ao mês passado
            let expenseVariationPercentage = 0;
            if (prevTotalExpenses > 0) {
                expenseVariationPercentage = Number((((totalExpenses - prevTotalExpenses) / prevTotalExpenses) *
                    100).toFixed(2));
            }
            // 5. Agrupamento de gastos por categoria (para gráfico de pizza/barras)
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
                .sort((a, b) => b.total - a.total); // Ordena da maior categoria para a menor
            // 6. Resumo rápido da saúde dos orçamentos
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
};
