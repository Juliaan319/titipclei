import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { getStoredCnyRate } from "@/lib/exchange-rate/get-cny-rate";
import { calculateProductPricing } from "@/lib/pricing/product-pricing";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApi(); if (access.response) return access.response;
  try { const { id } = await context.params; const product = await prisma.product.findUnique({ where: { id } }); const rate = await getStoredCnyRate(); if (!product || !rate) return NextResponse.json({ error: "Produk atau Kurs BI tidak tersedia." }, { status: 400 }); const pricing = calculateProductPricing({ purchasePriceCny: product.originalPrice, exchangeRate: rate.marketRate, chinaShipping: product.chinaShipping, internationalShipping: product.internationalShipping, tax: product.tax, additionalCost: product.additionalCost, marginType: product.marginType, marginPercentage: product.marginPercentage, marginFixed: product.marginFixed, roundingType: product.roundingType }); const body = await request.json().catch(() => ({})); const preview = { storedRate: Number(product.exchangeRate), latestRate: Number(rate.marketRate), currentSellingPrice: Number(product.sellingPrice), newSellingPrice: Number(pricing.finalSellingPrice) }; if (!body.confirm) return NextResponse.json(preview); await prisma.product.update({ where: { id }, data: { exchangeRate: new Prisma.Decimal(rate.marketRate), exchangeRateSource: rate.provider ?? "Bank Indonesia — Kurs Transaksi BI", exchangeRateDate: rate.sourceDate ?? rate.fetchedAt,  totalCost: pricing.totalCost, profit: pricing.profit, calculatedSellingPrice: pricing.calculatedSellingPrice, sellingPrice: pricing.finalSellingPrice } }); revalidatePath("/products"); revalidatePath("/"); revalidatePath("/admin/products"); return NextResponse.json({ ...preview, updated: true }); } catch { return NextResponse.json({ error: "Harga produk gagal dihitung ulang." }, { status: 400 }); }
}
