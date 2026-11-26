import { Router } from "express";
import { authLimiter } from "./middlewares/rateLimiter.js";
import { authMiddleware } from "./middlewares/AuthMiddleware.js";
import { AuthController } from "./controllers/AuthController.js";
import { ExpensesController } from "./controllers/ExpensesController.js";
import { SignaturesController } from "./controllers/SignaturesController.js";
import { InvestimentsController } from "./controllers/InvestimentsController.js";
import { CategoryController } from "./controllers/CategoryController.js";
import { AccountController } from "./controllers/AccountController.js";
import { SummaryController } from "./controllers/SummaryController.js";
import { BudgetController } from "./controllers/BudgetController.js";
import { ExportController } from "./controllers/ExportController.js";
import { UserController } from "./controllers/UserController.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "./schemas/expenseSchema.js";
import { validateSchema } from "./schemas/validateSchema.js";
import { categorySchema } from "./schemas/categorySchema.js";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./schemas/authSchema.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "./schemas/authSchema.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.post(
  "/login",
  authLimiter,
  validateSchema(loginSchema),
  AuthController.login,
);
router.post(
  "/register",
  authLimiter,
  validateSchema(registerSchema),
  AuthController.register,
);
router.post(
  "/forgot-password",
  authLimiter,
  validateSchema(forgotPasswordSchema),
  AuthController.forgotPassword,
);
router.post(
  "/reset-password",
  validateSchema(resetPasswordSchema),
  AuthController.resetPassword,
);

router.post("/budgets", authMiddleware, BudgetController.create);
router.get("/budgets/status", authMiddleware, BudgetController.getStatus);

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
  validateSchema(createExpenseSchema),
  ExpensesController.create,
);
router.get("/gastos", authMiddleware, ExpensesController.list);
router.put(
  "/gastos/:id",
  authMiddleware,
  validateSchema(createExpenseSchema),
  ExpensesController.create,
);
router.delete("/gastos/:id", authMiddleware, ExpensesController.delete);

router.post(
  "/categorias",
  authMiddleware,
  validateSchema(categorySchema),
  CategoryController.create,
);
router.get("/categorias", authMiddleware, CategoryController.list);
router.put(
  "/categorias/:id",
  authMiddleware,
  validateSchema(categorySchema),
  CategoryController.update,
);
router.delete("/categorias/:id", authMiddleware, CategoryController.delete);

router.get("/resumo", authMiddleware, UserController.getSummary);
router.get("/resumo/analitico", authMiddleware, SummaryController.analytical);
router.get(
  "/resumo/categorias",
  authMiddleware,
  SummaryController.categoryChart,
);
router.get(
  "/resumo/evolucao",
  authMiddleware,
  SummaryController.patrimonyEvolution,
);
router.get("/export/csv", authMiddleware, ExportController.exportCSV);
router.get("/export/pdf", authMiddleware, ExportController.exportPdf);

router.post("/contas", authMiddleware, AccountController.create);
router.get("/contas", authMiddleware, AccountController.list);
router.put("/contas/:id", authMiddleware, AccountController.update);
router.delete("/contas/:id", authMiddleware, AccountController.delete);

export { router };
