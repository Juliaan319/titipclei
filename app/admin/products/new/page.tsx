import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/require-admin";
import { AdminProductForm } from "@/components/AdminProductForm";
import { getStoredCnyRate } from "@/lib/exchange-rate/get-cny-rate";
import { CNY_SELL_RATE, CNY_SELL_RATE_AS_OF } from "@/lib/exchange-rate/rates";

const positiveRate = (value: unknown) => {
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : CNY_SELL_RATE;
};

export default async function NewProductPage() {
  await requireAdminPage();
  const [categories, stored] = await Promise.all([prisma.category.findMany({ orderBy: { name: "asc" } }), getStoredCnyRate()]);
  const date = stored?.sourceDate ?? stored?.fetchedAt;
  const rate = { rate: positiveRate(stored?.marketRate), asOf: date?.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) ?? CNY_SELL_RATE_AS_OF, provider: stored?.provider ?? "Bank Indonesia — Kurs Transaksi BI", status: stored ? "Data terbaru tersedia" : "Menggunakan Data Terakhir", fallback: !stored };
  return <div className="mx-auto max-w-7xl"><Link href="/admin/products" className="text-sm font-semibold text-rose-600">← Kembali</Link><h1 className="mt-4 text-3xl font-bold">Tambah Produk</h1><AdminProductForm categories={categories} rate={rate} /></div>;
}
