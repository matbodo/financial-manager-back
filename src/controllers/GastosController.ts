import type { Request, Response } from "express";
import { prisma } from "../server.js";
import {
  createGastoSchema,
  updateGastoSchema,
} from "../schemas/gastoSchema.js";

export const GastosController = {
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

      const gastos = await prisma.gastos.create({
        data: {
          name,
          value,
          date: date ? new Date(date) : new Date(),
          user_id: req.user!.id,
        },
      });

      return res.status(201).json(gastos);
    } catch (error) {
      console.error(error);
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

      const gastoExisting = await prisma.gastos.findFirst({
        where: {
          id: gastoId,
          user_id: req.user!.id,
        },
      });

      if (!gastoExisting) {
        return res.status(404).json({ message: "Gasto não encontrado" });
      }

      const { name, value, date } = validation.data;

      const gastoUpdated = await prisma.gastos.update({
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

      return res.status(200).json({ message: "Gasto deletado com sucesso" });
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },
};
