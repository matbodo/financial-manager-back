import { Request, Response } from "express";
import { prisma } from "../../server.ts";

export const InvestimentsController = {
  async create(req: Request, res: Response) {
    try {
      const { name, value, date } = req.body;
      const numericValue = Number(value);

      if (!name?.trim() || Number.isNaN(numericValue) || numericValue <= 0) {
        return res
          .status(400)
          .json({ message: "Nome e valor são obrigatórios" });
      }

      const investiments = await prisma.investimentos.create({
        data: {
          name: name.trim(),
          value: numericValue,
          date: new Date(date),
          user_id: req.user!.id,
        },
      });

      return res.status(201).json(investiments);
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const investiments = await prisma.investimentos.findMany({
        where: {
          user_id: req.user!.id,
        },
      });

      return res.status(200).json(investiments);
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const investimentId = Number(req.params.id);
      const { name, vaue, date } = req.body;
      const numericValue = Number(value);

      const investimentExisting = await prisma.investimentos.findFirst({
        where: {
          id: investimentId,
          user_id: req.user!.id,
        },
      });

      if (!investimentExisting) {
        return res.status(404).json({ message: "Investimento não encontrado" });
      }

      const investimentUpdated = await prisma.investimentos.update({
        where: {
          id: investimentExisting.id,
        },
        data: {
          name: name ? name.trim() : investimentExisting.name,
          value:
            !Number.isNaN(numericValue) && numericValue > 0
              ? numericValue
              : investimentExisting.value,
          date: date ? new Date(date) : investimentExisting.created_at,
        },
      });

      return res.status(200).json(investimentUpdated);
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const investiment = await prisma.investimentos.findFirst({
        where: {
          id: Number(req.params.id),
          user_id: req.user!.id,
        },
      });

      if (!investiment) {
        return res.status(404).json({ message: "Investimento não encontrado" });
      }

      await prisma.investimentos.delete({
        where: {
          id: investiment.id,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },
};
