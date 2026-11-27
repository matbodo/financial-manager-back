import { lte } from "zod";

export function getClampedDate(year: number, month: number, day: number): Date {
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const safeDay = Math.min(day, lastDayOfMonth);

  return new Date(year, month, safeDay, 12, 0, 0);
}

export function getStartingInvoicePeriod(
  purchaseDate: Date,
  closingDay: number,
) {
  let month = purchaseDate.getMonth() + 1;
  let year = purchaseDate.getFullYear();

  if (purchaseDate.getDate() >= closingDay) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return { month, year };
}

export function addMonthsToPeriod(
  startMonth: number,
  startYear: number,
  offset: number,
) {
  const totalMonths = startYear * 12 + (startMonth - 1) + offset;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;

  return { month, year };
}

export function splitInstallments(
  totalValue: number,
  installments: number,
): number[] {
  const totalCents = Math.round(totalValue * 100);
  const baseCents = Math.floor(totalCents / installments);
  const remainderCents = totalCents - baseCents * installments;

  return Array.from({ length: installments }, (_, index) => {
    const cents = index === 0 ? baseCents + remainderCents : baseCents;
    return Number((cents / 100).toFixed(2));
  });
}
