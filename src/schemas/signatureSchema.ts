import { z } from "zod";

export const createSignatureSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  value: z.coerce.number().positive("O valor deve ser maior que zero"),
  billing_day: z
    .number()
    .int()
    .min(1, "O dia de cobrança deve ser entre 1 e 31")
    .max(31, "O dia de cobrança deve ser entre 1 e 31"),
  category_id: z.number().int().optional(),
  active: z.boolean().optional(),
  date: z.string().datetime({ message: "Data inválida" }).optional(),
});

export const updateSignatureSchema = createSignatureSchema.partial();
