import cron from "node-cron";
import { prisma } from "../server";

export async function processRecurringSubscription() {
  try {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getDate();
    const currentYear = now.getFullYear();

    const lastDayOfMonth = new Date(currentDay, currentMonth + 1, 0).getDate();
    const isLastDayOfMonth = currentDay === lastDayOfMonth;

    const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const dueSignatures = await prisma.signature.findMany({
      where: {
        active: true,
        ...(isLastDayOfMonth
          ? { billing_day: { gte: currentDay } }
          : { billing_day: currentDay }),
      },
    });

    if (dueSignatures.length === 0) {
      console.log(
        `[CRON] Nenhuma assinatura para processar no dia ${currentDay}.`,
      );
      return;
    }

    let createdCount = 0;

    for (const signature of dueSignatures) {
      const alreadyProcessed = await prisma.expense.findFirst({
        where: {
          user_id: signature.user_id,
          name: signature.name,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      createdCount++;
    }

    console.log(
      `[CRON] Processamento concluído: ${createdCount} despesa(s) gerada(s).`,
    );
  } catch (error) {
    console.error("[CRON] Erro ao processar assinaturas recorrentes:", error);
  }
}

export function startSubscriptionJob() {
  cron.schedule(
    "* * * * *",
    async () => {
      console.log(
        "[CRON] Iniciando o processamento de assinaturas recorrentes...",
      );
      await processRecurringSubscription();
    },
    {
      timezone: "America/Sao_Paulo",
    },
  );

  console.log("[CRON] Agendador de assinaturas inicializado.");
}
