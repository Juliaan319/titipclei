import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminQuotationForm } from "@/components/AdminQuotationForm";
import { AdminRequestActions } from "@/components/AdminRequestActions";
import { AdminRequestDeleteButton } from "@/components/AdminRequestDeleteButton";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/require-admin";

const labels: Record<string, string> = { PENDING_REVIEW: "Baru", REVIEWED: "Sedang Dicek", QUOTATION_SENT: "Penawaran Dikirim", ACCEPTED: "Dikonversi ke Pesanan", QUOTATION_REJECTED: "Penawaran Ditolak", CANCELLED: "Ditolak" };

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const item = await prisma.jastipRequest.findUnique({ where: { id }, include: { user: true, quotations: { orderBy: { createdAt: "desc" } } } });
  if (!item) notFound();

  return <div className="mx-auto max-w-3xl"><Link href="/admin/requests" className="text-sm font-semibold text-rose-600">← Kembali</Link><h1 className="mt-4 text-3xl font-bold">{item.requestNumber}</h1><div className="mt-6 rounded-xl border bg-white p-6"><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">Customer</dt><dd className="font-semibold">{item.customerName || item.user?.name || "-"}</dd><dd className="text-sm">{item.customerPhone || item.user?.phone || "-"}</dd><dd className="text-sm">{item.customerEmail || item.user?.email || "-"}</dd></div><div><dt className="text-sm text-slate-500">Status</dt><dd className="font-semibold">{labels[item.status]}</dd><dd className="mt-1 text-sm">{item.createdAt.toLocaleString("id-ID")}</dd></div><div><dt className="text-sm text-slate-500">Nama barang</dt><dd className="font-semibold">{item.productName}</dd><dd className="text-sm">Jumlah: {item.quantity}</dd><dd className="text-sm">Varian: {item.variant || "-"}</dd></div><div><dt className="text-sm text-slate-500">Link barang</dt>{item.productUrl ? <dd><a href={item.productUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-rose-600">Buka Link Barang</a></dd> : <dd className="font-semibold">-</dd>}</div><div className="sm:col-span-2"><dt className="text-sm text-slate-500">Catatan</dt><dd className="mt-1 whitespace-pre-wrap">{item.notes || "-"}</dd></div></dl>{item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="mt-5 h-40 rounded-lg object-contain" />}<p className="mt-4 text-sm">Marketplace: {item.marketplace || "Belum ditentukan"} ? Estimasi CNY: {item.originalPrice ?? "Belum diisi"}</p><AdminRequestActions id={item.id} status={item.status} /><AdminRequestDeleteButton id={item.id} requestNumber={item.requestNumber} customerName={item.user?.name ?? null} productName={item.productName} detail />{item.quotations.map((quotation) => <Link key={quotation.id} href={`/admin/quotations/${quotation.id}`} className="mt-4 block rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{quotation.quotationNumber} · Lihat penawaran</Link>)}{item.status !== "ACCEPTED" && <AdminQuotationForm requestId={item.id} currency={item.currencyCode} quantity={item.quantity} />}</div></div>;
}
