"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const server_1 = require("../server");
class CategoryController {
    static async create(req, res) {
        try {
            const { name, color, icon } = req.body;
            const userId = req.user.id;
            const category = await server_1.prisma.category.create({
                data: {
                    name,
                    color,
                    icon,
                    user_id: userId,
                },
            });
            return res.status(201).json(category);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao criar categoria" });
        }
    }
    static async list(req, res) {
        try {
            const userId = req.user.id;
            const categories = await server_1.prisma.category.findMany({
                where: { user_id: userId },
            });
            return res.status(200).json(categories);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao listar categorias" });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, color, icon } = req.body;
            const userId = req.user.id;
            const existingCategory = await server_1.prisma.category.findFirst({
                where: { id: Number(id), user_id: userId },
            });
            if (!existingCategory) {
                return res.status(404).json({ message: "Categoria não encontrada" });
            }
            const updatedCategory = await server_1.prisma.category.update({
                where: { id: Number(id) },
                data: { name, color, icon },
            });
            return res.status(200).json(updatedCategory);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao atualizar categoria" });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const existingCategory = await server_1.prisma.category.findFirst({
                where: { id: Number(id), user_id: userId },
            });
            if (!existingCategory) {
                return res.status(404).json({ message: "Categoria nao encontrada" });
            }
            await server_1.prisma.category.delete({
                where: { id: Number(id) },
            });
            return res
                .status(200)
                .json({ message: "Categoria deletada com sucesso" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro ao deletar categoria" });
        }
    }
}
exports.CategoryController = CategoryController;
