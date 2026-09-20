import { reservePayment, paymentTransaction } from "@/lib/payments";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError } from "@/lib/api-error";
import { PaymentError } from "@/lib/payments";

const orderCode = () => `JH-CN-${crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;

export async function POST(request: NextRequest, context: { params: Promise<{ publicToken: string }> }) {
  const { publicToken } = await context.params;
  const { action } = await request.json() as { action?: "accept" | "reject"; reason?: string };
  if (action !== "accept" && action !== "reject") return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
  try {
    const result = await paymentTransaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Quotation" WHERE "publicToken" = ${publicToken} FOR UPDATE`;
      const quotation = await tx.quotation.findUnique({ where: { publicToken }, include: { jastipRequest: { include: { user: true } }, user: true } });
      if (!quotation) throw new PaymentError("Penawaran tidak ditemukan.");
      if (quotation.status === "ACCEPTED" && action === "accept") {
        const existing = await tx.order.findUnique({ where: { quotationId: quotation.id } });
        if (existing) return { orderToken: existing.publicToken };
      }
      if (quotation.expiresAt && quotation.expiresAt <= new Date()) {
        throw new PaymentError("Penawaran sudah kedaluwarsa.");
      }
      if (action === "reject") {
        if (quotation.status !== "SENT") throw new PaymentError("Penawaran ini tidak dapat ditolak.");
        await tx.quotation.update({ where: { id: quotation.id }, data: { status: "REJECTED", rejectedAt: new Date() } });
        if (quotation.jastipRequestId) await tx.jastipRequest.update({ where: { id: quotation.jastipRequestId }, data: { status: "QUOTATION_REJECTED" } });
        return { rejected: true };
      }
      if (quotation.status !== "SENT") throw new PaymentError("Penawaran ini tidak dapat diterima.");
      const updated = await tx.quotation.updateMany({ where: { id: quotation.id, status: "SENT" }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
      if (updated.count !== 1) throw new PaymentError("Penawaran ini sudah diproses.");
      const requestData = quotation.jastipRequest;
      const customer = quotation.user ?? requestData?.user;
      const order = await tx.order.create({ data: {
        orderNumber: orderCode(), quotationId: quotation.id, requestId: quotation.jastipRequestId,
        userId: quotation.userId, productNameSnapshot: requestData?.productName ?? "Pesanan jastip",
        variantNameSnapshot: requestData?.variant, variant: requestData?.variant,
        selectedImageSnapshot: requestData?.imageUrl, unitPriceSnapshot: quotation.finalPrice / quotation.quantity,
        totalCostSnapshot: quotation.totalCost, profitSnapshot: quotation.profit,
        unitPrice: quotation.finalPrice / quotation.quantity, quantity: quotation.quantity,
        customerName: requestData?.customerName ?? customer?.name, customerPhone: requestData?.customerPhone ?? customer?.phone, customerEmail: requestData?.customerEmail ?? customer?.email,
        subtotal: quotation.finalPrice, total: quotation.finalPrice,
        paymentStatus: "WAITING_PAYMENT", orderStatus: "WAITING_PAYMENT",
        orderTracking: { create: { status: "WAITING_PAYMENT", description: "Penawaran diterima. Menunggu pembayaran." } },
      }});
      await reservePayment(tx, order.id, quotation.finalPrice);
      if (quotation.jastipRequestId) await tx.jastipRequest.update({ where: { id: quotation.jastipRequestId }, data: { status: "ACCEPTED" } });
      return { orderToken: order.publicToken };
    });
    revalidatePath("/admin"); revalidatePath("/admin/orders");
    return NextResponse.json(result);
  } catch (error) { return apiError(error, "quotation-response"); }
}
