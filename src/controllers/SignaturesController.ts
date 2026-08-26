import type { Request, Response } from "express";
import { prisma } from "../../server.js";

export const SignaturesController = {
  async create(req: Request, res: Response) {
    try {
      const { name, value, date } = req.body;
      const numericValue = Number(value);

      if (!name?.trim() || Number.isNaN(numericValue) || numericValue <= 0) {
        return res
          .status(400)
          .json({ message: "Nome e valor são obrigatórios" });
      }

      const signatures = await prisma.assinaturas.create({
        data: {
          name: name.trim(),
          value: numericValue,
          date: new Date(date),
          user_id: req.user!.id,
        },
      });

      return res.status(201).json(signatures);
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const signatures = await prisma.assinaturas.findMany({
        where: {
          user_id: req.user!.id,
        },
      });

      return res.status(200).json(signatures);
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const signatureId = Number(req.params.id);
      const { name, value, date } = req.body;
      const numericValue = Number(value);

      const signatureExisting = await prisma.assinaturas.findFirst({
        where: {
          id: signatureId,
          user_id: req.user!.id,
        },
      });

      if (!signatureExisting) {
        return res.status(404).json({ message: "Assinatura não encontrada" });
      }

      const signatureUpdated = await prisma.assinaturas.update({
        where: {
          id: signatureExisting.id,
        },
        data: {
          name: name ? name.trim() : signatureExisting.name,
          value:
            !Number.isNaN(numericValue) && numericValue > 0
              ? numericValue
              : signatureExisting.value,
          date: date ? new Date(date) : signatureExisting.created_at,
        },
      });

      return res.status(200).json(signatureUpdated);
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const signature = await prisma.assinaturas.findFirst({
        where: {
          id: Number(req.params.id),
          user_id: req.user!.id,
        },
      });

      if (!signature) {
        return res.status(404).json({ message: "Assinatura não encontrada" });
        1;
      }

      await prisma.assinaturas.delete({
        where: {
          id: signature.id,
        },
      });

      return res.status(200).json({ message: "Assinatura deletada" });
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },
};
