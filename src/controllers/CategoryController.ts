import { Response, Request } from "express";
import { PrismaClient } from "@prisma/client";
import { json } from "zod";
import { tr } from "zod/v4/locales/index.js";

const prisma = new PrismaClient();

export class CategoryController {
  static async create(req: Request, res: Response) {
    try {
      const { name, color, icon } = req.body;
      const userId = (req as any).userId;

      const category = await prisma.category.create({
        data: {
          name,
          color,
          icon,
          user_id: userId,
        },
      });

      return res.status(201).json(category);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao criar categoria" });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const categories = await prisma.category.findMany({
        where: { user_id: userId },
      });

      return res.status(200).json(categories);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao listar categorias" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, color, icon } = req.body;
      const userId = (req as any).userId;

      const existingCategory = await prisma.user.findFirst({
        where: { id: Number(id), user_id: userId },
      });

      if (!existingCategory) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      const updatedCategory = await prisma.category.update({
        where: { id: Number(id) },
        data: { name, color, icon },
      });

      return res.status(201).json(updatedCategory);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao atualizar categoria" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const existingCategory = await prisma.category.findFirst({
        where: { id: Number(id), user_id: userId },
      });
      if (!existingCategory) {
        return res.status(404).json({ message: "Categoria nao encontrada" });
      }

      await prisma.category.delete({
        where: { id: Number(id) },
      });

      return res
        .status(200)
        .json({ message: "Categoria deletada com sucesso" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao deletar categoria" });
    }
  }
}
