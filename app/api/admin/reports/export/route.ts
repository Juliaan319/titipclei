import { orderFinance } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";

const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/^[=+@-]/, "\' $&").replaceAll('"', '""')}"`;

export async function GET() {
  const access = await requireAdminApi(); if (access.response) return access.response;
  const orders = await prisma.order.findMany({ include: { user: true, quotation: true, procurement: true, payment: true, orderTracking: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" } });
  const headers = ["Pesanan", "Tanggal", "Pelanggan", "WhatsApp", "Nilai pesanan", "Biaya", "Laba kotor", "Kode unik", "Nominal transfer", "Status pembayaran", "Status pesanan", "Jenis biaya"];
  const rows = orders.map(order => { const finance = orderFinance(order); return [order.orderNumber, order.createdAt.toISOString(), order.customerName || order.user?.name, order.customerPhone || order.user?.phone, finance.revenue, finance.cost, finance.profit, order.payment?.uniqueCode, order.payment?.transferAmount, order.paymentStatus, order.orderStatus, finance.actual ? "Aktual" : "Estimasi"]; });
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="jastiphub-laporan-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
