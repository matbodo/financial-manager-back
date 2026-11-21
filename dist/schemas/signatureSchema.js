"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSignatureSchema = exports.createSignatureSchema = void 0;
const zod_1 = require("zod");
exports.createSignatureSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "O nome é obrigatório"),
    value: zod_1.z.coerce.number().positive("O valor deve ser maior que zero"),
    billing_day: zod_1.z
        .number()
        .int()
        .min(1, "O dia de cobrança deve ser entre 1 e 31")
        .max(31, "O dia de cobrança deve ser entre 1 e 31"),
    category_id: zod_1.z.number().int().optional(),
    active: zod_1.z.boolean().optional(),
    date: zod_1.z.string().datetime({ message: "Data inválida" }).optional(),
});
exports.updateSignatureSchema = exports.createSignatureSchema.partial();
