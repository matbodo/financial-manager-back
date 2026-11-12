import type { Request, Response } from "express";
import { prisma } from "../server.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  refreshTokenSchema,
  resetPasswordSchema,
} from "../schemas/authSchema.js";
import { sendEmail } from "../utils/sendEmail.js";

async function generateAndSaveRefreshToken(userId: number): Promise<string> {
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" },
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      user_id: userId,
      expiresAt,
    },
  });

  return refreshToken;
}
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

      const refreshToken = await generateAndSaveRefreshToken(user.id);

      return res.status(200).json({
        token,
        refreshToken,
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

      const refreshToken = await generateAndSaveRefreshToken(user.id);

      return res.status(201).json({
        token,
        refreshToken,
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

      // 1. Verifica se a assinatura JWT é válida
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string,
      ) as { id: number };

      // 2. Busca o token no banco de dados
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken) {
        return res
          .status(401)
          .json({ message: "Refresh token inválido ou revogado" });
      }

      // 3. Remove o token antigo (Rotação de Refresh Token)
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // 4. Busca o usuário
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      // 5. Emite um novo Access Token e um novo Refresh Token
      const newToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "15m" },
      );

      const newRefreshToken = await generateAndSaveRefreshToken(user.id);

      return res.status(200).json({
        token: newToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(401)
        .json({ message: "Refresh token inválido ou expirado" });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      }

      return res.status(200).json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao realizar logout" });
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(200).json({
          message:
            "Se o e-mail for valido, um link de recuperação foi enviado.",
        });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");

      const resetTokenExpires = new Date();
      resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpires,
        },
      });

      const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

      await sendEmail({
        to: user.email!,
        subject: "Recuperação de senha",
        html: `<h3>Você solicitou a recuperação de senha</h3>
          <p>Clique no link abaixo para redefinir sua senha. Este link é válido por 1 hora.</p>
          <a href="${resetUrl}" target="_blank">Redefinir Senha</a>
          <br/><br/>
          <p>Se você não solicitou isso, ignore este e-mail.</p>
          `,
      });

      return res.status(200).json({
        message: "Se o e-mail existir, um link de recuperação foi enviado.",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erro ao tentar enviar e-mail de recuperação" });
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;

      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpires: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        return res.status(400).json({ message: "Token inválido ou expirado." });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpires: null,
        },
      });

      return res.status(200).json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao definir a senha" });
    }
  },
};
