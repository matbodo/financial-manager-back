import type { Request, Response } from "express";
import { prisma } from "../server.js";
import PDFDocument from "pdfkit";

export const ExportController = {
  async exportCSV(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { month, year, startDate, endDate } = req.query;

      let dateFilter: { gte?: Date; lte?: Date } | undefined;

      if (startDate && endDate) {
        dateFilter = {
          gte: new Date(`${startDate}T00:00:00.000Z`),
          lte: new Date(`${endDate}T23:59:59.999Z`),
        };
      } else if (month && year) {
        const m = Number(month);
        const y = Number(year);
        dateFilter = {
          gte: new Date(y, m - 1, 1, 0, 0, 0),
          lte: new Date(y, m, 0, 23, 59, 59, 999),
        };
      }

      const [expenses, investments] = await Promise.all([
        prisma.expense.findMany({
          where: {
            user_id: userId,
            ...(dateFilter && { date: dateFilter }),
          },
          include: { category: true },
          orderBy: { date: "desc" },
        }),
        prisma.investment.findMany({
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
          date: item.date ? new Date(item.date) : new Date(item.created_at!),
          name: item.name,
          category: item.category?.name || "Sem categoria",
          value: Number(item.value),
        })),
        ...investments.map((item) => ({
          type: "Investimento",
          date: item.date ? new Date(item.date) : new Date(item.created_at!),
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

      const fileName =
        month && year
          ? `movimentacoes-${String(month).padStart(2, "0")}-${year}.csv`
          : "movimentacoes-completas.csv";

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );

      return res.status(200).send(csvContent);
    } catch (error) {
      console.error(error);
      console.error(error);
      return res.status(500).json({ message: "Erro ao exportar arquivo CSV" });
    }
  },

  async exportPdf(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { month, year, startDate, endDate } = req.query;

      let dateFilter: { gte?: Date; lte?: Date } | undefined;
      let periodLabel = "Histórico Completo";

      if (startDate && endDate) {
        dateFilter = {
          gte: new Date(`${startDate}T00:00:00.000Z`),
          lte: new Date(`${endDate}T23:59:59.999Z`),
        };
        periodLabel = `Período: ${startDate} até ${endDate}`;
      } else if (month && year) {
        const m = Number(month);
        const y = Number(year);
        dateFilter = {
          gte: new Date(y, m - 1, 1, 0, 0, 0),
          lte: new Date(y, m, 0, 23, 59, 59, 999),
        };
        periodLabel = `Referência: ${String(m).padStart(2, "0")}/${y}`;
      }

      const [user, expenses, investments] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        }),
        prisma.expense.findMany({
          where: {
            user_id: userId,
            ...(dateFilter && { date: dateFilter }),
          },
          include: { category: true },
          orderBy: { date: "desc" },
        }),
        prisma.investment.findMany({
          where: {
            user_id: userId,
            ...(dateFilter && { date: dateFilter }),
          },
          include: { category: true },
          orderBy: { date: "desc" },
        }),
      ]);

      const totalExpenses = expenses.reduce(
        (acc, item) => acc + Number(item.value),
        0,
      );
      const totalInvestments = investments.reduce(
        (acc, item) => acc + Number(item.value),
        0,
      );

      const transactions = [
        ...expenses.map((item) => ({
          type: "Gasto",
          date: item.date ? new Date(item.date) : new Date(item.created_at!),
          name: item.name,
          category: item.category?.name || "Sem categoria",
          value: Number(item.value),
        })),
        ...investments.map((item) => ({
          type: "Investimento",
          date: item.date ? new Date(item.date) : new Date(item.created_at!),
          name: item.name,
          category: item.category?.name || "Sem categoria",
          value: Number(item.value),
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      const formatBRL = (val: number) =>
        val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      const fileName =
        month && year
          ? `relatorio-financeiro-${String(month).padStart(2, "0")}-${year}.pdf`
          : "relatorio-financeiro.pdf";

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );

      const doc = new PDFDocument({ margin: 40, size: "A4" });
      doc.pipe(res);

      // --- CABEÇALHO DO RELATÓRIO ---
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text("Relatório Financeiro Consolidado", { align: "left" });

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#6b7280")
        .text(
          `Titular: ${user?.name || "Usuário"} (${user?.email || ""})  |  ${periodLabel}`,
        )
        .text(
          `Gerado em: ${new Date().toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })}`,
        );

      doc.moveDown(1.5);

      // --- BLOCO DE RESUMO (CARDS) ---
      const summaryTop = doc.y;
      doc.rect(40, summaryTop, 515, 55).fillAndStroke("#f3f4f6", "#e5e7eb");

      doc
        .fillColor("#374151")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("TOTAL DE GASTOS", 60, summaryTop + 12)
        .text("TOTAL INVESTIDO", 230, summaryTop + 12)
        .text("MOVIMENTAÇÕES", 410, summaryTop + 12);

      doc
        .fontSize(13)
        .fillColor("#dc2626")
        .text(formatBRL(totalExpenses), 60, summaryTop + 28)
        .fillColor("#16a34a")
        .text(formatBRL(totalInvestments), 230, summaryTop + 28)
        .fillColor("#111827")
        .text(`${transactions.length} registros`, 410, summaryTop + 28);

      doc.y = summaryTop + 75;

      // --- TABELA DE MOVIMENTAÇÕES ---
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text("Detalhamento de Movimentações", 40, doc.y);

      doc.moveDown(0.6);

      // Função auxiliar para desenhar cabeçalho da tabela
      const drawTableHeader = (y: number) => {
        doc.rect(40, y, 515, 22).fill("#1f2937");
        doc
          .fillColor("#ffffff")
          .fontSize(9)
          .font("Helvetica-Bold")
          .text("DATA", 48, y + 7)
          .text("TIPO", 115, y + 7)
          .text("DESCRIÇÃO", 195, y + 7)
          .text("CATEGORIA", 365, y + 7)
          .text("VALOR", 470, y + 7, { width: 75, align: "right" });
      };

      let currentY = doc.y;
      drawTableHeader(currentY);
      currentY += 26;

      if (transactions.length === 0) {
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor("#6b7280")
          .text(
            "Nenhuma movimentação encontrada para o período.",
            40,
            currentY + 10,
          );
      } else {
        transactions.forEach((t, index) => {
          // Quebra de página automática se chegar perto da margem inferior
          if (currentY > 750) {
            doc.addPage();
            currentY = 40;
            drawTableHeader(currentY);
            currentY += 26;
          }

          // Fundo zebrado nas linhas pares
          if (index % 2 === 1) {
            doc.rect(40, currentY - 4, 515, 20).fill("#f9fafb");
          }

          const dateStr = t.date.toLocaleDateString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          });
          const isExpense = t.type === "Gasto";

          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#374151")
            .text(dateStr, 48, currentY)
            .fillColor(isExpense ? "#dc2626" : "#16a34a")
            .font("Helvetica-Bold")
            .text(t.type, 115, currentY)
            .fillColor("#111827")
            .font("Helvetica")
            .text(t.name, 195, currentY, { width: 160, ellipsis: true })
            .fillColor("#4b5563")
            .text(t.category, 365, currentY, { width: 95, ellipsis: true })
            .fillColor(isExpense ? "#dc2626" : "#16a34a")
            .font("Helvetica-Bold")
            .text(formatBRL(t.value), 470, currentY, {
              width: 75,
              align: "right",
            });

          currentY += 20;
        });
      }

      // Finaliza o stream e envia o PDF completo
      doc.end();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao exportar arquivo pdf" });
    }
  },
};
