import type { Request, Response } from "express";
import { prisma } from "../server.js";
import {
  createGastoSchema,
  updateGastoSchema,
} from "../schemas/gastoSchema.js";
import {
  buildListQuery,
  formatPaginationResponse,
} from "../utils/buildListQuery.js";

export const ExpensesController = {
  async create(req: Request, res: Response) {
    try {
      const validation = createGastoSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { name, value, date } = validation.data;

      const expense = await prisma.expense.create({
        data: {
          name,
          value,
          date: date ? new Date(date) : new Date(),
          user_id: req.user!.id,
        },
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

      if (Number.isNaN(gastoId)) {
        return res.status(400).json({ message: "ID de gasto inválido" });
      }

      const validation = updateGastoSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const gastoExisting = await prisma.expense.findFirst({
        where: {
          id: gastoId,
          user_id: req.user!.id,
        },
      });

      if (!gastoExisting) {
        return res.status(404).json({ message: "Gasto não encontrado" });
      }

      const { name, value, date } = validation.data;

      const gastoUpdated = await prisma.expense.update({
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

      await prisma.expense.delete({
        where: {
          id: gasto.id,
        },
      });

      return res.status(200).json({ message: "Gasto deletado com sucesso" });
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },
};
