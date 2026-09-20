import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { PaymentError } from "@/lib/payments";
import { apiError } from "@/lib/api-error";
const schema = z.object({ action: z.enum(["verify", "reject"]), reason: z.string().trim().max(500).optional() });
export async function PATCH(request: Request, context: { params: Promise<{ paymentId: string }> }) {
  const access = await requireAdminApi(); if (access.response) return access.response;
  try {
    const { paymentId } = await context.params;
    const { action, reason } = schema.parse(await request.json());
    const verified = action === "verify";
    await prisma.$transaction(async tx => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
      if (payment) await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${payment.orderId} FOR UPDATE`;
      const currentOrder = payment ? await tx.order.findUnique({ where: { id: payment.orderId } }) : null;
      if (!payment || currentOrder?.orderStatus === "CANCELLED" || payment.order.orderStatus === "CANCELLED") throw new PaymentError("Pembayaran tidak dapat diproses.");
      const claimed = await tx.payment.updateMany({ where: { id: paymentId, status: "WAITING_VERIFICATION" }, data: verified ? { status: "VERIFIED", verifiedAt: new Date(), rejectionReason: null } : { status: "REJECTED", rejectedAt: new Date(), rejectionReason: reason || "Bukti pembayaran belum dapat diverifikasi." } });
      if (!claimed.count) throw new PaymentError("Pembayaran sudah diproses atau belum memiliki bukti transfer.");
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: verified ? "VERIFIED" : "REJECTED", orderStatus: verified ? "PURCHASING" : "WAITING_PAYMENT" } });
      await tx.orderTracking.create({ data: { orderId: payment.orderId, status: verified ? "PURCHASING" : "WAITING_PAYMENT", description: verified ? "Pembayaran diverifikasi. Barang sedang dipesan." : `Bukti pembayaran ditolak: ${reason || "Silakan periksa bukti dan nominal transfer."}` } });
    });
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error, "verify-payment"); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ paymentId: string }> }) {
  const access = await requireAdminApi();
  if (access.response) return access.response;
  try {
    const { paymentId } = await context.params;
    const payment = await prisma.payment.findUnique({ where: { id: paymentId }, select: { id: true, orderId: true } });
    if (!payment) return NextResponse.json({ error: "Pembayaran tidak ditemukan." }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.deleteMany({ where: { paymentId } });
      await tx.payment.delete({ where: { id: paymentId } });
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "WAITING_PAYMENT", orderStatus: "WAITING_PAYMENT" } });
    });
    revalidatePath("/admin/payments"); revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${payment.orderId}`); revalidatePath("/admin");
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, "payment-delete");
  }
}
