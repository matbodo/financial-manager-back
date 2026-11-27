"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClampedDate = getClampedDate;
exports.getStartingInvoicePeriod = getStartingInvoicePeriod;
exports.addMonthsToPeriod = addMonthsToPeriod;
exports.splitInstallments = splitInstallments;
function getClampedDate(year, month, day) {
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const safeDay = Math.min(day, lastDayOfMonth);
    return new Date(year, month, safeDay, 12, 0, 0);
}
function getStartingInvoicePeriod(purchaseDate, closingDay) {
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
function addMonthsToPeriod(startMonth, startYear, offset) {
    const totalMonths = startYear * 12 + (startMonth - 1) + offset;
    const year = Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    return { month, year };
}
function splitInstallments(totalValue, installments) {
    const totalCents = Math.round(totalValue * 100);
    const baseCents = Math.floor(totalCents / installments);
    const remainderCents = totalCents - baseCents * installments;
    return Array.from({ length: installments }, (_, index) => {
        const cents = index === 0 ? baseCents + remainderCents : baseCents;
        return Number((cents / 100).toFixed(2));
    });
}
