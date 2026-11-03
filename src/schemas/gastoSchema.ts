import { z } from "zod";

export const createGastoSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  value: z.coerce.number().positive("O valor deve ser maior que zero"),
  date: z.string().datetime({ message: "Data inválida" }).optional(),
});

export const updateGastoSchema = createGastoSchema.partial();
