"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignaturesController = void 0;
const server_js_1 = require("../server.js");
const signatureSchema_js_1 = require("../schemas/signatureSchema.js");
exports.SignaturesController = {
    async create(req, res) {
        try {
            const validation = signatureSchema_js_1.createSignatureSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    message: "Dados inválidos",
                    error: validation.error.flatten().fieldErrors,
                });
            }
            const { name, value, date } = validation.data;
            const signature = await server_js_1.prisma.signature.create({
                data: {
                    name,
                    value,
                    date: date ? new Date(date) : new Date(),
                    user_id: req.user.id,
                },
            });
            return res.status(201).json(signature);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async list(req, res) {
        try {
            const signature = await server_js_1.prisma.signature.findMany({
                where: {
                    user_id: req.user.id,
                },
            });
            return res.status(200).json(signature);
        }
        catch (error) {
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async update(req, res) {
        try {
            const signatureId = Number(req.params.id);
            if (Number.isNaN(signatureId)) {
                return res.status(400).json({ message: "ID de assinatura inválido" });
            }
            const validation = signatureSchema_js_1.updateSignatureSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    message: "Dados inválidos",
                    error: validation.error.flatten().fieldErrors,
                });
            }
            const signatureExisting = await server_js_1.prisma.signature.findFirst({
                where: {
                    id: signatureId,
                    user_id: req.user.id,
                },
            });
            if (!signatureExisting) {
                return res.status(404).json({ message: "Assinatura não encontrada" });
            }
            const { name, value, date } = validation.data;
            const signatureUpdated = await server_js_1.prisma.signature.update({
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
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    async delete(req, res) {
        try {
            const signatureId = Number(req.params.id);
            if (Number.isNaN(signatureId)) {
                return res.status(400).json({ message: "ID de assinatura inválido" });
            }
            const signature = await server_js_1.prisma.signature.findFirst({
                where: {
                    id: signatureId,
                    user_id: req.user.id,
                },
            });
            if (!signature) {
                return res.status(404).json({ message: "Assinatura não encontrada" });
            }
            await server_js_1.prisma.signature.delete({
                where: {
                    id: signature.id,
                },
            });
            return res.status(200).json({ message: "Assinatura deletada" });
        }
        catch (error) {
            return res.status(500).json({ message: "Erro interno do servidor" });
        }
    },
};
