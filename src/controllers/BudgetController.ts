import { Request, Response } from "express";
import { prisma } from "../server";

export class BudgetController {
  static async create(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { category_id, amount, month, year } = req.body;

      const budget = await prisma.budget.upsert({
        where: {
          user_id_category_id_month_year: {
            user_id: userId,
            category_id,
            month,
            year,
          },
        },
        update: { amount },
        create: {
          user_id: userId,
          category_id,
          month,
          year,
          amount: Number(amount),
        },
      });

      return res.status(200).json(budget);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao definir orçamento" });
    }
  }

  static async getStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { month, year } = req.query;

      const currentDate = new Date();
      const targetMonth = month ? Number(month) : currentDate.getMonth() + 1;
      const targetYear = year ? Number(year) : currentDate.getFullYear();

      const budgets = await prisma.budget.findMany({
        where: { user_id: userId, month: targetMonth, year: targetYear },
        include: { category: true },
      });

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 1);

      const expensesGrouped = await prisma.expense.groupBy({
        by: ["category_id"],
        where: {
          user_id: userId,
          created_at: {
            gte: startDate,
            lt: endDate,
          },
          category_id: { not: null },
        },
        _sum: { value: true },
      });

      const statusReport = budgets.map((budget) => {
        const expenseData = expensesGrouped.find(
          (e) => e.category_id === budget.category_id,
        );

        const limit = Number(budget.amount);
        const spent = Number(expenseData?._sum.value || 0);
        const remainig = limit - spent;
        const percentageUsed = limit > 0 ? (spent / limit) * 100 : 0;

        return {
          id: budget.id,
          categoryId: budget.category_id,
          categoryName: budget.category.name,
          color: budget.category.icon,
          limit,
          spent,
          remainig,
          percentageUsed: Number(percentageUsed.toFixed(2)),
        };
      });

      return res.status(200).json({
        month: targetMonth,
        year: targetYear,
        budgets: statusReport,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erro ao consultar status do orçamento" });
    }
  }
}
