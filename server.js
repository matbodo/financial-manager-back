import express from "express";
import "dotenv/config";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client.ts";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado");
}

const adapter = new PrismaMariaDb({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root123",
  database: "meubanco",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });
export { prisma };

const app = express();
app.use(express.json());
//TODO CONFIGURAR CORS PARA PERMITIR APENAS O FRONTEND
app.use(cors()); // PERMITE REQUISIÇÕES DE QUALQUER ORIGEM

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token de autenticação ausente" });
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token de autenticação inválido" });
  }
}

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password.trim()) {
    return res.status(400).json({
      message: "Email e senha são obrigatórios",
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(401).json({
      message: "Email ou senha inválidos",
    });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({
      message: "Email ou senha inválidos",
    });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      income: user.income,
    },
  });
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password.trim()) {
    return res.status(401).json({
      message: "Nome, email e senha são obrigatórios",
    });
  }

  if (password.length < 8) {
    return res.status(401).json({
      message: "A senha deve conter pelo menos 8 caracteres",
    });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (existingUser) {
    return res.status(401).json({
      message: "Email já cadastrado",
    });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      income: user.income,
    },
  });
});

//Renda
app.patch("/usuarios/renda", authMiddleware, async (req, res) => {
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
app.post("/assinaturas", authMiddleware, async (req, res) => {
  const { name, value, billingDay } = req.body;
  const numericValue = Number(value);

  if (!name?.trim() || Number.isNaN(numericValue) || numericValue <= 0) {
    return res.status(400).json({
      message: "Nome e valor são obrigatórios",
    });
  }

  const assinaturas = await prisma.assinaturas.create({
    data: {
      name: name.trim(),
      value: numericValue,
      billing_day: billingDay,
      user_id: req.user.id,
    },
  });
  return res.status(201).json(assinaturas);
});

app.get("/assinaturas", authMiddleware, async (req, res) => {
  const assinaturas = await prisma.assinaturas.findMany({
    where: {
      user_id: req.user.id,
    },
  });

  return res.status(200).json(assinaturas);
});

app.delete("/assinaturas/:id", authMiddleware, async (req, res) => {
  const assinatura = await prisma.assinaturas.findFirst({
    where: {
      id: Number(req.params.id),
      user_id: req.user.id,
    },
  });

  await prisma.assinaturas.delete({
    where: {
      id: assinatura.id,
    },
  });

  return res.status(200).json({ message: "Assinatura deletada" });
});

//Investimentos
app.post("/investimentos", authMiddleware, async (req, res) => {
  const { name, value, date } = req.body;
  const numericValue = Number(value);

  if (!name?.trim() || Number.isNaN(numericValue) || numericValue <= 0) {
    return res.status(400).json({
      message: "Nome e valor são obrigatórios",
    });
  }

  const investimentos = await prisma.investimentos.create({
    data: {
      name: name.trim(),
      value: numericValue,
      date: new Date(date),
      user_id: req.user.id,
    },
  });
  return res.status(201).json(investimentos);
});

app.get("/investimentos", authMiddleware, async (req, res) => {
  const investimentos = await prisma.investimentos.findMany({
    where: {
      user_id: req.user.id,
    },
  });

  return res.status(200).json(investimentos);
});

app.delete("/investimentos/:id", authMiddleware, async (req, res) => {
  const investimento = await prisma.investimentos.findFirst({
    where: {
      id: Number(req.params.id),
      user_id: req.user.id,
    },
  });

  await prisma.investimentos.delete({
    where: {
      id: investimento.id,
    },
  });

  return res.status(200).json({ message: "Investimento deletado" });
});

//Gastos
app.post("/gastos", authMiddleware, async (req, res) => {
  const { name, value, date } = req.body;
  const numericValue = Number(value);

  if (!name?.trim() || Number.isNaN(numericValue) || numericValue <= 0) {
    return res.status(400).json({
      message: "Nome e valor são obrigatórios",
    });
  }

  const gastos = await prisma.gastos.create({
    data: {
      name: name.trim(),
      value: numericValue,
      created_at: new Date(date),
      user_id: req.user.id,
    },
  });
  return res.status(201).json(gastos);
});

app.get("/gastos", authMiddleware, async (req, res) => {
  const gastos = await prisma.gastos.findMany({
    where: {
      user_id: req.user.id,
    },
  });

  return res.status(200).json(gastos);
});

app.delete("/gastos/:id", authMiddleware, async (req, res) => {
  const gasto = await prisma.gastos.findFirst({
    where: {
      id: Number(req.params.id),
      user_id: req.user.id,
    },
  });

  await prisma.gastos.delete({
    where: {
      id: gasto.id,
    },
  });

  return res.status(200).json({ message: "Gasto deletado" });
});

//Resumo
app.get("/resumo", authMiddleware, async (req, res) => {
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

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

// app.put("/usuarios/:id", async (req, res) => {
//   await prisma.user.update({
//     where: {
//       id: Number(req.params.id),
//     },
//     data: {
//       email: req.body.email,
//       name: req.body.name,
//     },
//   });
//   res.status(201).json(res.body);
// });

//

// app.delete("/usuarios/:id", async (req, res) => {
//   await prisma.user.delete({
//     where: {
//       id: Number(req.params.id),
//     },
//   });
//   res.status(201).json({ message: "User deleted" });
// });
