import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentError } from "@/lib/payments";
import { apiError } from "@/lib/api-error";
export async function POST(request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId: token } = await context.params;
    const form = await request.formData();
    const proof = form.get("proof");
    if (!(proof instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(proof.type) || !proof.size || proof.size > 10 * 1024 * 1024) throw new PaymentError("Bukti harus JPG, PNG, atau WEBP, maksimal 10 MB.");
    const bytes = Buffer.from(await proof.arrayBuffer());
    const valid = proof.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : proof.type === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (!valid) throw new PaymentError("Isi file gambar tidak valid.");
    const order = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "publicToken" = ${token} FOR UPDATE`;
      const order = await tx.order.findUnique({ where: { publicToken: token } });
      if (!order || order.orderStatus !== "WAITING_PAYMENT") throw new PaymentError("Pesanan tidak dapat menerima bukti pembayaran saat ini.");
      if (!order.recipientName || !order.recipientPhone || !order.addressLine || !order.city || !order.province || !order.postalCode) throw new PaymentError("Lengkapi alamat pengiriman terlebih dahulu.");
      const updated = await tx.payment.updateMany({ where: { orderId: order.id, status: "WAITING_PAYMENT", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, data: {
        proofImageUrl: `data:${proof.type};base64,${bytes.toString("base64")}`, status: "WAITING_VERIFICATION", submittedAt: new Date(),
        senderName: String(form.get("senderName") || "").slice(0, 120), notes: String(form.get("notes") || "").slice(0, 500),
      } });
      if (!updated.count) throw new PaymentError("Nominal pembayaran kedaluwarsa atau bukti sudah dikirim. Muat ulang halaman.");
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "WAITING_VERIFICATION", orderStatus: "WAITING_VERIFICATION" } });
      await tx.orderTracking.create({ data: { orderId: order.id, status: "WAITING_VERIFICATION", description: "Bukti pembayaran diunggah dan menunggu verifikasi." } });
      return order;
    });
    return NextResponse.json({ redirectTo: `/order/success/${order.publicToken}` });
  } catch (error) { return apiError(error, "payment-proof"); }
}
