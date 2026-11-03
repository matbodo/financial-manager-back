import type { Request, Response } from "express";
import { prisma } from "../server.js";
import {
  updateSignatureSchema,
  createSignatureSchema,
} from "../schemas/signatureSchema.js";

export const SignaturesController = {
  async create(req: Request, res: Response) {
    try {
      const validation = createSignatureSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          error: validation.error.flatten().fieldErrors,
        });
      }

      const { name, value, date } = validation.data;

      const signatures = await prisma.assinaturas.create({
        data: {
          name,
          value,
          date: date ? new Date(date) : new Date(),
          user_id: req.user!.id,
        },
      });

      return res.status(201).json(signatures);
    } catch (error) {
      console.error(error);
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

      if (Number.isNaN(signatureId)) {
        return res.status(400).json({ message: "ID de assinatura inválido" });
      }

      const validation = updateSignatureSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          error: validation.error.flatten().fieldErrors,
        });
      }

      const signatureExisting = await prisma.assinaturas.findFirst({
        where: {
          id: signatureId,
          user_id: req.user!.id,
        },
      });

      if (!signatureExisting) {
        return res.status(404).json({ message: "Assinatura não encontrada" });
      }

      const { name, value, date } = validation.data;

      const signatureUpdated = await prisma.assinaturas.update({
        where: {
          id: signatureExisting.id,
        },
        data: {
          ...(name !== undefined && { name }),
          ...(value !== undefined && { value }),
          ...(date !== undefined && { date: new Date(date) }),
        },
      });

      return res.status(200).json(signatureUpdated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const signatureId = Number(req.params.id);

      if (Number.isNaN(signatureId)) {
        return res.status(400).json({ message: "ID de assinatura inválido" });
      }

      const signature = await prisma.assinaturas.findFirst({
        where: {
          id: signatureId,
          user_id: req.user!.id,
        },
      });

      if (!signature) {
        return res.status(404).json({ message: "Assinatura não encontrada" });
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
