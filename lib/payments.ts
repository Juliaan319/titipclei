import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { paymentDestination } from "@/lib/payment-settings";

export class PaymentError extends Error {}
export const activePaymentStatuses = ["WAITING_PAYMENT", "WAITING_VERIFICATION"] as const;

export async function expirePayments(tx: Prisma.TransactionClient, baseAmount?: number) {
  const expired = await tx.payment.updateManyAndReturn({
    where: { status: "WAITING_PAYMENT", expiresAt: { lte: new Date() }, ...(baseAmount === undefined ? {} : { baseAmount }) },
    data: { status: "EXPIRED" }, select: { orderId: true },
  });
  if (expired.length) {
    await tx.order.updateMany({ where: { id: { in: expired.map(p => p.orderId) }, orderStatus: "WAITING_PAYMENT" }, data: { paymentStatus: "EXPIRED" } });
    await tx.orderTracking.createMany({ data: expired.map(p => ({ orderId: p.orderId, status: "WAITING_PAYMENT", description: "Waktu pembayaran berakhir. Buat nominal pembayaran baru sebelum transfer." })) });
  }
}

export async function reservePayment(tx: Prisma.TransactionClient, orderId: string, total: number) {
  if (!Number.isSafeInteger(total) || total <= 0) throw new PaymentError("Total pembayaran tidak valid.");
  // Transaction-scoped PostgreSQL lock serializes allocation for the same base.
  // A partial unique index independently protects against other writers.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`payment:${total}`}, 0))::text`;
  await expirePayments(tx, total);
  const current = await tx.payment.findUnique({ where: { orderId } });
  if (current && activePaymentStatuses.some(s => s === current.status)) return current;
  if (current && !["REJECTED", "EXPIRED", "FAILED"].includes(current.status)) throw new PaymentError("Pembayaran ini sudah diselesaikan.");
  const active = await tx.payment.findMany({ where: { baseAmount: total, status: { in: [...activePaymentStatuses] } }, select: { uniqueCode: true } });
  const used = new Set(active.map(p => p.uniqueCode));
  const uniqueCode = Array.from({ length: 100 }, (_, i) => i + 1).find(code => !used.has(code));
  if (!uniqueCode) throw new PaymentError("Kode pembayaran sementara penuh. Silakan coba kembali beberapa saat lagi.");
  const configuredMinutes = Number(process.env.PAYMENT_EXPIRY_MINUTES || 30);
  const minutes = Number.isFinite(configuredMinutes) && configuredMinutes >= 5 ? configuredMinutes : 30;
  const data = { amount: total + uniqueCode, baseAmount: total, uniqueCode, transferAmount: total + uniqueCode, status: "WAITING_PAYMENT" as const, expiresAt: new Date(Date.now() + minutes * 60_000), bankName: paymentDestination.bankName, destinationAccount: paymentDestination.accountNumber, accountHolder: paymentDestination.accountHolder };
  if (current) {
    await tx.paymentAttempt.create({ data: { paymentId: current.id, baseAmount: current.baseAmount, uniqueCode: current.uniqueCode, transferAmount: current.transferAmount, status: current.status, proofImageUrl: current.proofImageUrl, proofStorageKey: current.proofStorageKey, submittedAt: current.submittedAt, rejectionReason: current.rejectionReason } });
    return tx.payment.update({ where: { id: current.id }, data: { ...data, proofImageUrl: null, proofStorageKey: null, submittedAt: null, rejectedAt: null, rejectionReason: null, senderName: null, notes: null } });
  }
  return tx.payment.create({ data: { ...data, orderId } });
}

export async function paymentTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(operation, { timeout: 15000 }); }
    catch (error) {
      if (attempt < 3 && error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code)) continue;
      throw error;
    }
  }
}
