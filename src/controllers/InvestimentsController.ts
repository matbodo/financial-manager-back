import type { Request, Response } from "express";
import { prisma } from "../server.js";
import {
  updateInvestimentSchema,
  createInvestimentSchema,
} from "../schemas/investimentSchema.js";
import {
  buildListQuery,
  formatPaginationResponse,
} from "../utils/buildListQuery.js";

export const InvestimentsController = {
  async create(req: Request, res: Response) {
    try {
      const validation = createInvestimentSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const { name, value, date, category_id, account_id } = validation.data;
      const userId = req.user!.id;

      if (account_id) {
        const accountExisting = await prisma.account.findFirst({
          where: { id: account_id, user_id: userId },
        });

        if (!accountExisting) {
          return res.status(404).json({ message: "Conta não encontrada" });
        }
      }

      const investiments = await prisma.$transaction(async (tx) => {
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

      const [investments, totalItems] = await Promise.all([
        prisma.investment.findMany({
          where: query.where,
          skip: query.skip,
          take: query.take,
          orderBy: query.orderBy,
          include: { category: true },
        }),
        prisma.investment.count({ where: query.where }),
      ]);

      return res
        .status(200)
        .json(
          formatPaginationResponse(
            investments,
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
      const investimentId = Number(req.params.id);
      const userId = req.user!.id;

      if (Number.isNaN(investimentId)) {
        return res.status(400).json({
          message: "ID de investimento inválido",
        });
      }

      const validation = updateInvestimentSchema.safeParse(req.params.id);

      if (!validation.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const investimentExisting = await prisma.investment.findFirst({
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
        const accountExisting = await prisma.account.findFirst({
          where: { id: account_id, user_id: userId },
        });

        if (!accountExisting) {
          return res.status(404).json({ message: "Conta nao encontrada" });
        }
      }

      const finalValue =
        value !== undefined ? value : Number(investimentExisting.value);
      const finalAccountId =
        account_id !== undefined ? account_id : investimentExisting.account_id;

      const investimentUpdated = await prisma.$transaction(async (tx) => {
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
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const investimentId = Number(req.params.id);

      if (Number.isNaN(investimentId)) {
        return res.status(400).json({ message: "ID de gasto inválido" });
      }

      const investiment = await prisma.investment.findFirst({
        where: {
          id: investimentId,
          user_id: req.user!.id,
        },
      });

      if (!investiment) {
        return res.status(404).json({ message: "Investimento não encontrado" });
      }

      await prisma.$transaction(async (tx) => {
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
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },
};
