import type { Request, Response } from "express";
import { prisma } from "../server.js";

export const UserController = {
  async updateIncome(req: Request, res: Response) {
    const income = Number(req.body.income);

    if (Number.isNaN(income) || income < 0) {
      return res
        .status(400)
        .json({ message: "Renda deve ser um número positivo" });
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { income: income },
    });

    return res.status(200).json(user);
  },

  async getSummary(req: Request, res: Response) {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const assinaturas = await prisma.assinaturas.aggregate({
      where: { user_id: userId },
      _sum: { value: true },
    });

    const investimentos = await prisma.investimentos.aggregate({
      where: { user_id: userId },
      _sum: { value: true },
    });

    const gastos = await prisma.gastos.aggregate({
      where: { user_id: userId },
      _sum: { value: true },
    });

    const income = Number(user?.income) || 0;
    const assinaturasTotal = Number(assinaturas._sum.value) || 0;
    const investimentosTotal = Number(investimentos._sum.value) || 0;
    const gastosTotal = Number(gastos._sum.value) || 0;

    return res.status(200).json({
      income,
      assinaturas: assinaturasTotal,
      investimentos: investimentosTotal,
      gastos: gastosTotal,
      totalGeral: assinaturasTotal + investimentosTotal + gastosTotal,
    });
  },
};
