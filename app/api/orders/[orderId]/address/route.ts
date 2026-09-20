import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeIndonesianPhone } from "@/lib/phone";

const addressSchema = z.object({ recipientName: z.string().trim().min(1).max(120), recipientPhone: z.string().trim().min(1).max(32), addressLine: z.string().trim().min(10).max(500), district: z.string().trim().min(2).max(120), city: z.string().trim().min(2).max(120), province: z.string().trim().min(2).max(120), postalCode: z.string().trim().min(3).max(16), shippingNote: z.string().trim().max(500).optional() });

export async function PATCH(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  const input = addressSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "Lengkapi alamat pengiriman dengan benar." }, { status: 400 });
  const recipientPhone = normalizeIndonesianPhone(input.data.recipientPhone);
  if (!recipientPhone) return NextResponse.json({ error: "Nomor WhatsApp penerima tidak valid." }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { publicToken: orderId }, select: { id: true, paymentStatus: true } });
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  if (order.paymentStatus === "VERIFIED" || order.paymentStatus === "PAID") return NextResponse.json({ error: "Alamat tidak dapat diubah setelah pembayaran diverifikasi." }, { status: 409 });
  await prisma.order.update({ where: { id: order.id }, data: { ...input.data, recipientPhone, shippingNote: input.data.shippingNote || null } });
  revalidatePath(`/payment/${orderId}`);
  revalidatePath(`/admin/orders/${order.id}`);
  return NextResponse.json({ success: true });
}
