import "dotenv/config";
import cors from "cors";
import express from "express";
import { router } from "./routes.js";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { startSubscriptionJob } from "./jobs/subscriptionJob.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurado");
}

const databaseUrl = new URL(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.slice(1),
  port: Number(databaseUrl.port || 3306),
  connectionLimit: 5,
  acquireTimeout: 30000,
  connectTimeout: 30000,
});

const prisma = new PrismaClient({ adapter });
export { prisma };

const app = express();
const FRONTEND_URL = "https://financial-manager-dusky.vercel.app";

app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_URL,
  }),
);

app.use(router);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  startSubscriptionJob();
});
