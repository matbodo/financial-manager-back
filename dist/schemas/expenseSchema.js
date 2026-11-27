"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExpenseSchema = exports.createExpenseSchema = exports.baseExpenseSchema = void 0;
const zod_1 = require("zod");
exports.baseExpenseSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "O nome é obrigatório"),
    value: zod_1.z.coerce.number().positive("O valor deve ser maior que zero"),
    date: zod_1.z.string().datetime({ message: "Data inválida" }).optional(),
    category_id: zod_1.z.number().int().positive().nullable().optional(),
    account_id: zod_1.z.number().int().positive().nullable().optional(),
    credit_card_id: zod_1.z.number().int().positive().nullable().optional(),
    installments: zod_1.z.coerce.number().int().min(1).max(48).default(1),
});
exports.createExpenseSchema = exports.baseExpenseSchema.refine((data) => !(data.account_id && data.credit_card_id), {
    message: "Informe apenas uma conta (débito) ou um cartão de crédito",
    path: ["credit_card_id"],
});
exports.updateExpenseSchema = exports.baseExpenseSchema
    .omit({ credit_card_id: true, installments: true })
    .partial();
