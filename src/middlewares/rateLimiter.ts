import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message:
      "Muitas tentativas realizadas. Por favor, tente novamente em 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
