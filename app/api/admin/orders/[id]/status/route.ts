import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { PaymentError } from "@/lib/payments";
import { apiError } from "@/lib/api-error";
const stages = ["PURCHASING", "PURCHASED", "CHECKING_ITEM", "INTERNATIONAL_SHIPPING", "ARRIVED_INDONESIA", "DOMESTIC_SHIPPING", "COMPLETED"] as const;
const schema = z.object({ status: z.enum([...stages, "CANCELLED"]), description: z.string().max(500).optional(), courier: z.string().max(120).optional(), trackingNumber: z.string().max(120).optional(), location: z.string().max(120).optional() });
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApi(); if (access.response) return access.response;
  try {
    const { id } = await context.params; const input = schema.parse(await request.json());
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${id} FOR UPDATE`;
      const order = await tx.order.findUnique({ where: { id } });
      if (!order || ["CANCELLED", "COMPLETED"].includes(order.orderStatus)) throw new PaymentError("Pesanan sudah selesai atau dibatalkan.");
      if (input.status !== "CANCELLED") {
        if (!["VERIFIED", "PAID"].includes(order.paymentStatus)) throw new PaymentError("Verifikasi pembayaran sebelum memproses pesanan.");
        const current = stages.indexOf(order.orderStatus as typeof stages[number]); const next = stages.indexOf(input.status);
        if (next < current || next > current + 1) throw new PaymentError("Perbarui status secara berurutan.");
        if (input.status === "DOMESTIC_SHIPPING" && (!order.addressLine || !input.trackingNumber || !input.courier)) throw new PaymentError("Alamat, kurir, dan nomor resi wajib untuk pengiriman lokal.");
      } else {
        await tx.payment.updateMany({ where: { orderId: id, status: { in: ["WAITING_PAYMENT", "WAITING_VERIFICATION"] } }, data: { status: "FAILED", rejectionReason: "Pesanan dibatalkan." } });
      }
      await tx.order.update({ where: { id }, data: { orderStatus: input.status, ...(input.status === "CANCELLED" && !["VERIFIED", "PAID"].includes(order.paymentStatus) ? { paymentStatus: "FAILED" } : {}) } });
      await tx.orderTracking.create({ data: { orderId: id, ...input } });
    });
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error, "order-status"); }
}
