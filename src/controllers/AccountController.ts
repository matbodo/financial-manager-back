import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";

const createAccountSchema = z.object({
  name: z.string().min(1, "Nome da conta é obrigatório"),
  type: z
    .enum(["CHECKING", "SAVINGS", "WALLET", "INVESTMENT"])
    .default("CHECKING"),
  balance: z.coerce.number().default(0),
  color: z.string().optional(),
});

const updateAccountSchema = createAccountSchema.partial();

export const AccountController = {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const data = createAccountSchema.parse(req.body);

      const account = await prisma.account.create({
        data: {
          ...data,
          user_id: userId,
        },
      });

      return res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.issues });
      }
      console.error(error);
      return res.status(500).json({ message: "Erro ao criar conta" });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const accounts = await prisma.account.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "asc" },
      });

      const totalBalance = accounts.reduce(
        (acc, item) => acc + Number(item.balance),
        0,
      );

      return res.status(200).json({
        totalBalance: Number(totalBalance.toFixed(2)),
        accounts,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao listar contas" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const id = Number(req.params.id);
      const data = updateAccountSchema.parse(req.body);

      const existing = await prisma.account.findFirst({
        where: { id, user_id: userId },
      });

      if (!existing) {
        return res.status(404).json({ message: "Conta não encontrada" });
      }

      const updated = await prisma.account.update({
        where: { id },
        data,
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao atualizar conta" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const id = Number(req.params.id);

      const existing = await prisma.account.findFirst({
        where: { id, user_id: userId },
      });

      if (!existing) {
        return res.status(404).json({ message: "Conta não encontrada" });
      }

      await prisma.account.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao excluir conta" });
    }
  },
};
