import type { Request, Response } from "express";
import { prisma } from "../server.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { refreshTokenSchema } from "../schemas/authSchema.js";

export const AuthController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findFirst({ where: { email } });

      if (!user) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      const passwordMath = await bcrypt.compare(
        password,
        user.password as string,
      );

      if (!passwordMath) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "15m" },
      );

      const refresToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_JWT_SECRET as string,
        { expiresIn: "7d" },
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
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      const userExists = await prisma.user.findUnique({ where: { email } });

      if (userExists) {
        return res.status(409).json({ message: "Email já cadastrado" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "1d" },
      );

      const refresToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_JWT_SECRET as string,
        { expiresIn: "7d" },
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
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      const decode = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string,
      ) as { id: number };

      const user = await prisma.user.findUnique({
        where: { id: decode.id },
      });

      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      const newToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "15m" },
      );

      return res.status(200).json({ token: newToken });
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Refresh token inválido ou expirado" });
    }
  },
};
