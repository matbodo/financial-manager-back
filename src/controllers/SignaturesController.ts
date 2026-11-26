import type { Request, Response } from "express";
import { prisma } from "../server.js";
import {
  updateSignatureSchema,
  createSignatureSchema,
} from "../schemas/signatureSchema.js";
import {
  buildListQuery,
  formatPaginationResponse,
} from "../utils/buildListQuery.js";
import e from "cors";

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

      const {
        name,
        value,
        billing_day,
        category_id,
        account_id,
        date,
        active,
      } = validation.data;
      const userId = req.user!.id;

      if (account_id) {
        const accountExists = await prisma.account.findFirst({
          where: { id: account_id, user_id: userId },
        });

        if (!accountExists) {
          return res.status(404).json({ message: "Conta não encontrada" });
        }
      }

      const signature = await prisma.signature.create({
        data: {
          name,
          value,
          billing_day,
          category_id: category_id ?? null,
          account_id: account_id ?? null,
          date: date ? new Date(date) : new Date(),
          ...(active !== undefined && { active }),
          user_id: userId,
        },
        include: {
          category: true,
          account: true,
        },
      });

      return res.status(201).json(signature);
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

      const [signatures, totalItems] = await Promise.all([
        prisma.signature.findMany({
          where: query.where,
          skip: query.skip,
          take: query.take,
          orderBy: query.orderBy,
          include: { category: true, account: true },
        }),
        prisma.signature.count({ where: query.where }),
      ]);

      return res
        .status(200)
        .json(
          formatPaginationResponse(
            signatures,
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
      const signatureId = Number(req.params.id);
      const userId = req.user!.id;

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

      const signatureExisting = await prisma.signature.findFirst({
        where: {
          id: signatureId,
          user_id: userId,
        },
      });

      if (!signatureExisting) {
        return res.status(404).json({ message: "Assinatura não encontrada" });
      }

      const {
        name,
        value,
        active,
        category_id,
        account_id,
        billing_day,
        date,
      } = validation.data;

      if (account_id) {
        const accountExists = await prisma.account.findFirst({
          where: { id: account_id, user_id: userId },
        });

        if (!accountExists) {
          return res.status(404).json({ message: "Conta não encontrada" });
        }
      }

      const signatureUpdated = await prisma.signature.update({
        where: {
          id: signatureExisting.id,
        },
        data: {
          ...(name !== undefined && { name }),
          ...(value !== undefined && { value }),
          ...(active !== undefined && { active }),
          ...(billing_day !== undefined && { billing_day }),
          ...(category_id !== undefined && { category_id }),
          ...(account_id !== undefined && { account_id }),
          ...(date !== undefined && { date: new Date(date) }),
        },
        include: {
          category: true,
          account: true,
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

      const signature = await prisma.signature.findFirst({
        where: {
          id: signatureId,
          user_id: req.user!.id,
        },
      });

      if (!signature) {
        return res.status(404).json({ message: "Assinatura não encontrada" });
      }

      await prisma.signature.delete({
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
