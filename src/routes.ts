import { Router } from "express";
import { AuthController } from "./controllers/AuthController.js";
import { authMiddleware } from "./middlewares/AuthMiddleware.js";
import { GastosController } from "./controllers/GastosController.js";
import { SignaturesController } from "./controllers/SignaturesController.js";
import { InvestimentsController } from "./controllers/InvestimentsController.js";
import { UserController } from "./controllers/UserController.js";
import { validateSchema } from "./schemas/validateSchema.js";
import { forgotPassword } from "./schemas/authSchema.js";

import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "./schemas/authSchema.js";
import { createGastoSchema, updateGastoSchema } from "./schemas/gastoSchema.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.post("/login", validateSchema(loginSchema), AuthController.login);
router.post(
  "/register",
  validateSchema(registerSchema),
  AuthController.register,
);
router.post(
  "/forgot-password",
  validateSchema(forgotPassword),
  AuthController.forgortPassword,
);

router.patch("/usuarios/renda", authMiddleware, UserController.updateIncome);

router.post("/assinaturas", authMiddleware, SignaturesController.create);
router.get("/assinaturas", authMiddleware, SignaturesController.list);
router.put("/assinaturas/:id", authMiddleware, SignaturesController.update);
router.delete("/assinaturas/:id", authMiddleware, SignaturesController.delete);

router.post("/investimentos", authMiddleware, InvestimentsController.create);
router.get("/investimentos", authMiddleware, InvestimentsController.list);
router.put("/investimentos/:id", authMiddleware, InvestimentsController.update);
router.delete(
  "/investimentos/:id",
  authMiddleware,
  InvestimentsController.delete,
);

router.post(
  "/gastos",
  authMiddleware,
  validateSchema(createGastoSchema),
  GastosController.create,
);
router.get("/gastos", authMiddleware, GastosController.list);
router.put(
  "/gastos/:id",
  authMiddleware,
  validateSchema(createGastoSchema),
  GastosController.create,
);
router.delete("/gastos/:id", authMiddleware, GastosController.delete);

router.get("/resumo", authMiddleware, UserController.getSummary);

export { router };
