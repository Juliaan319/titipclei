import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { PaymentError } from "@/lib/payments";
import { apiError } from "@/lib/api-error";
const money = z.coerce.number().finite().min(0).max(1e12);
const schema = z.object({ orderId: z.string().min(1), marketplace: z.enum(["Pinduoduo","Taobao","1688","Shopee China","Other"]), seller: z.string().max(200), productUrl: z.string().url().or(z.literal("")), currency: z.enum(["CNY","IDR"]), purchasePrice: money, exchangeRate: z.coerce.number().positive().max(1e6), quantity: z.coerce.number().int().min(1).max(999), chinaShipping: money, internationalShipping: money, tax: money, additionalCost: money, status: z.enum(["PLANNED","PURCHASED","WAITING_SHIPMENT"]), purchasedAt: z.string().optional(), externalOrderNumber: z.string().max(200), notes: z.string().max(2000) });
export async function POST(request: Request) {
 const access = await requireAdminApi(); if (access.response) return access.response;
 try {
  const input = schema.parse(await request.json());
  await prisma.$transaction(async tx => {
   await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id"=${input.orderId} FOR UPDATE`;
   const order = await tx.order.findUnique({ where: { id: input.orderId }, include: { procurement: true } });
   if (!order || !["VERIFIED","PAID"].includes(order.paymentStatus) || ["CANCELLED","COMPLETED"].includes(order.orderStatus)) throw new PaymentError("Pengadaan hanya tersedia untuk pesanan aktif yang sudah dibayar.");
   if (input.quantity !== order.quantity) throw new PaymentError("Jumlah pengadaan harus sesuai pesanan.");
   if (order.procurement?.status !== "PLANNED" && order.procurement && input.status === "PLANNED") throw new PaymentError("Pembelian yang sudah tercatat tidak dapat dikembalikan menjadi rencana.");
   const exchangeRate = input.currency === "IDR" ? 1 : input.exchangeRate;
   const totalCost = new Prisma.Decimal(input.purchasePrice).mul(input.quantity).mul(exchangeRate).plus(input.chinaShipping).plus(input.internationalShipping).plus(input.tax).plus(input.additionalCost);
   const purchasedAt = input.status === "PLANNED" ? null : input.purchasedAt ? new Date(input.purchasedAt) : new Date();
   if (purchasedAt && Number.isNaN(purchasedAt.getTime())) throw new PaymentError("Tanggal pembelian tidak valid.");
   const data = { ...input, productUrl: input.productUrl || null, exchangeRate, totalCost, purchasedAt, variant: [order.selectedColor, order.selectedSize, order.selectedModel, order.variant].filter(Boolean).join(" / ") };
   await tx.procurement.upsert({ where: { orderId: order.id }, create: data, update: data });
   const early = ["PAID","PURCHASING","PURCHASED","CHECKING_ITEM"].includes(order.orderStatus);
   const status = early && input.status !== "PLANNED" ? input.status === "PURCHASED" ? "PURCHASED" : "CHECKING_ITEM" : order.orderStatus;
   await tx.order.update({ where: { id: order.id }, data: { orderStatus: status } });
   await tx.orderTracking.create({ data: { orderId: order.id, status, description: input.status === "PLANNED" ? "Pembelian barang sedang disiapkan." : input.status === "PURCHASED" ? "Barang telah dibeli dari penjual." : "Barang menunggu pengiriman dari penjual." } });
  });
  return NextResponse.json({ success: true });
 } catch(error) { return apiError(error,"procurement-save"); }
}
