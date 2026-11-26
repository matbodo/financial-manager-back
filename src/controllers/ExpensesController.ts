import type { Request, Response } from "express";
import { prisma } from "../server.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "../schemas/expenseSchema.js";
import {
  buildListQuery,
  formatPaginationResponse,
} from "../utils/buildListQuery.js";

export const ExpensesController = {
  async create(req: Request, res: Response) {
    try {
      const validation = createExpenseSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { name, value, date, category_id, account_id } = validation.data;
      const userId = req.user!.id;

      if (account_id) {
        const accountExists = await prisma.account.findFirst({
          where: { id: account_id, user_id: userId },
        });

        if (!accountExists) {
          return res.status(404).json({ message: "Conta não encontrada" });
        }
      }

      const expense = await prisma.$transaction(async (tx) => {
        const created = await tx.expense.create({
          data: {
            name,
            value,
            date: date ? new Date(date) : new Date(),
            category_id: category_id ?? null,
            account_id: account_id ?? null,
            user_id: req.user!.id,
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
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const query = buildListQuery(req, {
        userId: req.user!.id,
        allowSortFields: ["date", "created_at", "value", "name"],
        dateField: "date",
      });

      const [expenses, totalItems] = await Promise.all([
        prisma.expense.findMany({
          where: query.where,
          skip: query.skip,
          take: query.take,
          orderBy: query.orderBy,
          include: { category: true },
        }),
        prisma.expense.count({ where: query.where }),
      ]);

      return res
        .status(200)
        .json(
          formatPaginationResponse(
            expenses,
            totalItems,
            query.pagination.page,
            query.pagination.limit,
          ),
        );
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const gastoId = Number(req.params.id);
      const userId = req.user!.id;

      if (Number.isNaN(gastoId)) {
        return res.status(400).json({ message: "ID de gasto inválido" });
      }

      const validation = updateExpenseSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const gastoExisting = await prisma.expense.findFirst({
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
        const accountExists = await prisma.account.findFirst({
          where: {
            id: account_id,
            user_id: userId,
          },
        });

        if (!accountExists) {
          return res.status(404).json({ message: "Conta não encontrada" });
        }
      }

      const finalValue =
        value !== undefined ? value : Number(gastoExisting.value);
      const finalAccountId =
        account_id !== undefined ? account_id : gastoExisting.account_id;

      const gastoUpdated = await prisma.$transaction(async (tx) => {
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
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const gastoId = Number(req.params.id);

      if (Number.isNaN(gastoId)) {
        return res.status(400).json({ message: "ID de gasto inválido" });
      }

      const gasto = await prisma.expense.findFirst({
        where: {
          id: Number(req.params.id),
          user_id: req.user!.id,
        },
      });

      if (!gasto) {
        return res.status(404).json({ message: "Gasto não encontrado" });
      }

      await prisma.$transaction(async (tx) => {
        if (gasto.account_id) {
          await tx.account.update({
            where: { id: gasto.account_id },
            data: {
              balance: { increment: gasto.value },
            },
          });
        }

        await prisma.expense.delete({
          where: {
            id: gasto.id,
          },
        });
      });

      return res.status(200).json({ message: "Gasto deletado com sucesso" });
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },
};
