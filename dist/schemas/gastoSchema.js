"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGastoSchema = exports.createGastoSchema = void 0;
const zod_1 = require("zod");
exports.createGastoSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "O nome é obrigatório"),
    value: zod_1.z.coerce.number().positive("O valor deve ser maior que zero"),
    date: zod_1.z.string().datetime({ message: "Data inválida" }).optional(),
});
exports.updateGastoSchema = exports.createGastoSchema.partial();
