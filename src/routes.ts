import { Router } from "express";
import { AuthController } from "./controllers/AuthController.js";
import { authMiddleware } from "./middlewares/AuthMiddleware.js";
import { GastosController } from "./controllers/GastosController.js";
import { SignaturesController } from "./controllers/SignaturesController.js";
import { InvestimentsController } from "./controllers/InvestimentsController.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

//Renda
router.patch("/usuarios/renda", authMiddleware, async (req, res) => {
  const income = Number(req.body.income);

  if (Number.isNaN(income) || income < 0) {
    return res.status(400).json({
      message: "Renda deve ser um número positivo",
    });
  }

  const user = await prisma.user.update({
    where: {
      id: req.user.id,
    },
    data: {
      income: income,
    },
  });

  return res.status(200).json(user);
});

//Assinaturas
router.post("/assinaturas", authMiddleware, SignaturesController.create);
router.get("/assinaturas", authMiddleware, SignaturesController.list);
router.put("/assinaturas/:id", authMiddleware, SignaturesController.update);
router.delete("/assinaturas/:id", authMiddleware, SignaturesController.delete);

//Investimentos
router.post("/investimentos", authMiddleware, InvestimentsController.create);
router.get("/investimentos", authMiddleware, InvestimentsController.list);
router.put("/investimentos/:id", authMiddleware, InvestimentsController.update);
router.delete(
  "/investimentos/:id",
  authMiddleware,
  InvestimentsController.delete,
);

//Gastos
router.post("/gastos", authMiddleware, GastosController.create);
router.get("/gastos", authMiddleware, GastosController.list);
router.put("/gastos/:id", authMiddleware, GastosController.update);
router.delete("/gastos/:id", authMiddleware, GastosController.delete);

//Resumo
router.get("/resumo", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  const assinaturas = await prisma.assinaturas.aggregate({
    where: {
      user_id: userId,
    },
    _sum: {
      value: true,
    },
  });

  const investimentos = await prisma.investimentos.aggregate({
    where: {
      user_id: userId,
    },
    _sum: {
      value: true,
    },
  });

  const gastos = await prisma.gastos.aggregate({
    where: {
      user_id: userId,
    },
    _sum: {
      value: true,
    },
  });

  const income = Number(user?.income) || 0;
  const assinaturasTotal = Number(assinaturas._sum.value) || 0;
  const investimentosTotal = Number(investimentos._sum.value) || 0;
  const gastosTotal = Number(gastos._sum.value) || 0;

  return res.status(200).json({
    income,
    assinaturas: assinaturasTotal,
    investimentos: investimentosTotal,
    gastos: gastosTotal,
    totalGeral: assinaturasTotal + investimentosTotal + gastosTotal,
  });
});

export { router };
