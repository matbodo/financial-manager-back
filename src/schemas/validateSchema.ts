import type { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validateSchema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Dados inválidos",
        errors: validation.error?.flatten().fieldErrors,
      });
    }

    req.body = validation.data;
    return next();
  };
};
