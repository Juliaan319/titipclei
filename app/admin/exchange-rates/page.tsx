import Link from "next/link";
import { requireAdminPage } from "@/lib/require-admin";
import { getStoredCnyRate } from "@/lib/exchange-rate/get-cny-rate";
import { AdminExchangeRateCard } from "@/components/AdminExchangeRateCard";

export default async function ExchangeRatesPage() {
  await requireAdminPage(); const rate = await getStoredCnyRate();
  return <div className="mx-auto max-w-7xl"><Link href="/admin" className="text-sm font-semibold text-rose-600">← Dashboard</Link><h1 className="mt-4 text-3xl font-bold">Kurs Exchange Rate</h1><p className="mt-2 text-slate-500">Kelola kurs tersimpan yang dipakai untuk perhitungan harga produk.</p><AdminExchangeRateCard initialRate={rate ? { sellRate: Number(rate.marketRate), buyRate: rate.buyRate ? Number(rate.buyRate) : null, sourceDate: (rate.sourceDate ?? rate.fetchedAt).toLocaleString("id-ID"), fetchedAt: rate.fetchedAt.toLocaleString("id-ID"), provider: rate.provider ?? "Bank Indonesia — Kurs Transaksi BI" } : null} /></div>;
}
