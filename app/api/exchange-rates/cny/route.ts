import { NextResponse } from "next/server";
import { CNY_SELL_RATE, CNY_SELL_RATE_AS_OF } from "@/lib/exchange-rate/rates";
import { getStoredCnyRate } from "@/lib/exchange-rate/get-cny-rate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rate = await getStoredCnyRate();
  const asOf = rate?.sourceDate ?? rate?.fetchedAt;
  return NextResponse.json({ rate: rate ? Number(rate.isManualOverride && rate.manualRate ? rate.manualRate : rate.marketRate) : CNY_SELL_RATE, buyRate: rate?.buyRate ? Number(rate.buyRate) : null, asOf: asOf?.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }) ?? CNY_SELL_RATE_AS_OF, fetchedAt: rate?.fetchedAt ?? null, provider: rate?.provider ?? "Bank Indonesia — Kurs Transaksi BI", status: rate ? "Data terbaru tersedia" : "Menggunakan data terakhir" });
}
