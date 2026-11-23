"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportController = void 0;
const server_js_1 = require("../server.js");
exports.ExportController = {
    async exportCSV(req, res) {
        try {
            const userId = req.user.id;
            const { month, year, startDate, endDate } = req.query;
            let dateFilter;
            if (startDate && endDate) {
                dateFilter = {
                    gte: new Date(`${startDate}T00:00:00.000Z`),
                    lte: new Date(`${endDate}T23:59:59.999Z`),
                };
            }
            else if (month && year) {
                const m = Number(month);
                const y = Number(year);
                dateFilter = {
                    gte: new Date(y, m - 1, 1, 0, 0, 0),
                    lte: new Date(y, m, 0, 23, 59, 59, 999),
                };
            }
            const [expenses, investments] = await Promise.all([
                server_js_1.prisma.expense.findMany({
                    where: {
                        user_id: userId,
                        ...(dateFilter && { date: dateFilter }),
                    },
                    include: { category: true },
                    orderBy: { date: "desc" },
                }),
                server_js_1.prisma.investment.findMany({
                    where: {
                        user_id: userId,
                        ...(dateFilter && { date: dateFilter }),
                    },
                    include: { category: true },
                    orderBy: { date: "desc" },
                }),
            ]);
            const transactions = [
                ...expenses.map((item) => ({
                    type: "Gasto",
                    date: item.date ? new Date(item.date) : new Date(item.created_at),
                    name: item.name,
                    category: item.category?.name || "Sem categoria",
                    value: Number(item.value),
                })),
                ...investments.map((item) => ({
                    type: "Investimento",
                    date: item.date ? new Date(item.date) : new Date(item.created_at),
                    name: item.name,
                    category: item.category?.name || "Sem categoria",
                    value: Number(item.value),
                })),
            ].sort((a, b) => b.date.getTime() - a.date.getTime());
            const header = [
                "Tipo",
                "Data",
                "Descricao",
                "Categoria",
                "Valor (R$)",
            ].join(";");
            const rows = transactions.map((t) => {
                const formattedDate = t.date.toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                });
                const safeName = `"${t.name.replace(/"/g, '""')}"`;
                const safeCategory = `"${t.category.replace(/"/g, '""')}"`;
                const formattedValue = t.value.toFixed(2).replace(".", ",");
                return [
                    t.type,
                    formattedDate,
                    safeName,
                    safeCategory,
                    formattedValue,
                ].join(";");
            });
            const csvContent = "\uFEFF" + [header, ...rows].join("\n");
            const fileName = month && year
                ? `movimentacoes-${String(month).padStart(2, "0")}-${year}.csv`
                : "movimentacoes-completas.csv";
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            return res.status(200).send(csvContent);
        }
        catch (error) {
            console.error(error);
            console.error(error);
            return res.status(500).json({ message: "Erro ao exportar arquivo CSV" });
        }
    },
};
