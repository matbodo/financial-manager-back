import { Request, Response } from "express";
import { prisma } from "../../server.ts";

export const GastosController = {
  async create(req: Request, res: Response) {
    try {
      const { name, value, date } = req.body;
      const numericValue = Number(value);

      if (!name?.trim() || Number.isNaN(numericValue) || numericValue <= 0) {
        return res
          .status(400)
          .json({ message: "Nome e valor são obrigatórios" });
      }

      const gastos = await prisma.gastos.create({
        data: {
          name: name.trim(),
          value: numericValue,
          date: new Date(date),
          user_id: req.user!.id,
        },
      });

      return res.status(201).json(gastos);
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const gastos = await prisma.gastos.findMany({
        where: {
          user_id: req.user!.id,
        },
      });

      return res.status(200).json(gastos);
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const gastoId = Number(req.params.id);
      const { name, value, date } = req.body;
      const numericValue = Number(value);

      const gastoExisting = await prisma.gastos.findFirst({
        where: {
          id: gastoId,
          user_id: req.user!.id,
        },
      });

      if (!gastoExisting) {
        return res.status(404).json({ message: "Gasto não encontrado" });
      }

      const gastoUpdated = await prisma.gastos.update({
        where: {
          id: gastoExisting.id,
        },
        data: {
          name: name ? name.trim() : gastoExisting.name,
          value:
            !Number.isNaN(numericValue) && numericValue > 0
              ? numericValue
              : gastoExisting.value,
          date: date ? new Date(date) : gastoExisting.created_at,
        },
      });

      return res.status(200).json(gastoUpdated);
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const gasto = await prisma.gastos.findFirst({
        where: {
          id: Number(req.params.id),
          user_id: req.user!.id,
        },
      });

      if (!gasto) {
        return res.status(404).json({ message: "Gasto não encontrado" });
      }

      await prisma.gastos.delete({
        where: {
          id: gasto.id,
        },
      });

      return res.status(200).json({ message: "Gasto deletado" });
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },
};
