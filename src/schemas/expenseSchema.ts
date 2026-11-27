import { z } from "zod";

export const baseExpenseSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  value: z.coerce.number().positive("O valor deve ser maior que zero"),
  date: z.string().datetime({ message: "Data inválida" }).optional(),
  category_id: z.number().int().positive().nullable().optional(),
  account_id: z.number().int().positive().nullable().optional(),
  credit_card_id: z.number().int().positive().nullable().optional(),
  installments: z.coerce.number().int().min(1).max(48).default(1),
});

export const createExpenseSchema = baseExpenseSchema.refine(
  (data) => !(data.account_id && data.credit_card_id),
  {
    message: "Informe apenas uma conta (débito) ou um cartão de crédito",
    path: ["credit_card_id"],
  },
);

export const updateExpenseSchema = baseExpenseSchema
  .omit({ credit_card_id: true, installments: true })
  .partial();
