import { Router } from "express";
import { AuthController } from "./controllers/AuthController.js";
import { authMiddleware } from "./middlewares/AuthMiddleware.js";
import { GastosController } from "./controllers/GastosController.js";
import { SignaturesController } from "./controllers/SignaturesController.js";
import { InvestimentsController } from "./controllers/InvestimentsController.js";
import { UserController } from "./controllers/UserController.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);

// Renda
router.patch("/usuarios/renda", authMiddleware, UserController.updateIncome);

// Assinaturas
router.post("/assinaturas", authMiddleware, SignaturesController.create);
router.get("/assinaturas", authMiddleware, SignaturesController.list);
router.put("/assinaturas/:id", authMiddleware, SignaturesController.update);
router.delete("/assinaturas/:id", authMiddleware, SignaturesController.delete);

// Investimentos
router.post("/investimentos", authMiddleware, InvestimentsController.create);
router.get("/investimentos", authMiddleware, InvestimentsController.list);
router.put("/investimentos/:id", authMiddleware, InvestimentsController.update);
router.delete(
  "/investimentos/:id",
  authMiddleware,
  InvestimentsController.delete,
);

// Gastos
router.post("/gastos", authMiddleware, GastosController.create);
router.get("/gastos", authMiddleware, GastosController.list);
router.put("/gastos/:id", authMiddleware, GastosController.update);
router.delete("/gastos/:id", authMiddleware, GastosController.delete);

// Resumo
router.get("/resumo", authMiddleware, UserController.getSummary);

export { router };
