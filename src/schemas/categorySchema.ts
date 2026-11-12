import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "O nome da categoria é obrigatório"),
  color: z.string().optional(),
  icon: z.string().optional(),
});
