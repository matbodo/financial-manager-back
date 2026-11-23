import cron from "node-cron";
import { prisma } from "../server";
import { sendEmail } from "../utils/sendEmail";

export async function sendUpcomingSubscriptionReminders() {
  try {
    const now = new Date();
    const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
    const dayToRemind = reminderDate.getDate();
    const lastDayOfMonth = new Date(
      reminderDate.getFullYear(),
      reminderDate.getMonth() + 1,
      0,
    ).getDate();
    const signatures = await prisma.signature.findMany({
      where: { active: true, billing_day: { not: null } },
      include: { usuarios: { select: { name: true, email: true } } },
    });

    for (const signature of signatures) {
      const billingDay = Math.min(signature.billing_day!, lastDayOfMonth);
      if (billingDay !== dayToRemind || !signature.usuarios.email) continue;

      await sendEmail({
        to: signature.usuarios.email,
        subject: `Lembrete: ${signature.name} vence em 3 dias`,
        html: `<p>Olá${signature.usuarios.name ? `, ${signature.usuarios.name}` : ""}!</p><p>A assinatura <strong>${signature.name}</strong>, no valor de R$ ${Number(signature.value).toFixed(2)}, vence em 3 dias (${reminderDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}).</p>`,
      });
    }
  } catch (error) {
    console.error("[CRON] Erro ao enviar lembretes de assinaturas:", error);
  }
}

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
    "0 0 * * *",
    sendUpcomingSubscriptionReminders,
    { timezone: "America/Sao_Paulo" },
  );

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
