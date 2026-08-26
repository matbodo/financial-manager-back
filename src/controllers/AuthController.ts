import { Request, Response } from "express";
import { prisma } from "../../server.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const AuthController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email.trim() || !password.trim()) {
      return res
        .status(400)
        .json({ message: "Email e senha são obrigatórios" });
    }

    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Email ou senha inválidos" });
    }

    const passwordMath = await bcrypt.compare(password, user.password);

    if (!passwordMath) {
      return res.status(401).json({ message: "Email ou senha inválidos" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
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
  },

  async register(req: Request, res: Response) {
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
  },
};
