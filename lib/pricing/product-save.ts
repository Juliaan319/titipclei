import { MarginType, Prisma, ProductStatus } from "@prisma/client";
import { z } from "zod";
import { getStoredCnyRate } from "@/lib/exchange-rate/get-cny-rate";
import { calculateProductPricing } from "./product-pricing";

const money = z.coerce.number().finite().min(0);

export const productSaveSchema = z.object({
  name: z.string().trim().min(1), brand: z.string().trim().optional(), description: z.string().trim().optional(), imageUrl: z.string().trim().url().or(z.literal("")).optional(), imageUrls: z.array(z.string().url()).optional(), categoryId: z.string().trim().nullable().optional(),
  originalPrice: z.coerce.number().finite().positive(), chinaShipping: money.default(0), internationalShipping: money.default(0), tax: money.default(0), additionalCost: money.default(0),
  marginType: z.nativeEnum(MarginType), marginPercentage: money.max(100).optional(), marginFixed: money.optional(), roundingType: z.enum(["NONE", "ROUND_1000", "ROUND_5000", "ROUND_10000"]),
  useLatestRate: z.boolean().default(false), useManualRate: z.boolean().default(false), manualRate: z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.number().finite().positive().optional()), stock: z.coerce.number().int().min(0).default(0), featured: z.boolean().default(false), status: z.nativeEnum(ProductStatus),
  variants: z.array(z.object({
    id: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    name: z.string().optional(),
    colorName: z.string().optional(),
    colorHex: z.string().optional(),
    size: z.string().optional(),
    model: z.string().optional(),
    stock: z.coerce.number().int().min(0).default(0),
    priceAdjustment: z.coerce.number().finite().int().min(0).default(0),
    images: z.array(z.string().url()).max(20).optional()
  })).optional()
});

type StoredRateFallback = {
  marketRate: Prisma.Decimal | number | string;
  provider: string | null;
  sourceDate: Date | null;
  fetchedAt: Date | null;
};

const isValidRate = (value: unknown) => {
  try {
    const rate = new Prisma.Decimal(value as string | number | Prisma.Decimal);
    return rate.isFinite() && rate.greaterThan(0);
  } catch {
    return false;
  }
};

export async function prepareProductSave(body: unknown, productRateSnapshot?: StoredRateFallback) {
  const input = productSaveSchema.parse(body);
  const combinations = new Set<string>();
  for (const variant of input.variants ?? []) {
    const key = [variant.colorName, variant.size, variant.model, variant.name].map(v => (v || "").trim().toLowerCase()).join("|");
    if (combinations.has(key)) throw new Error("Kombinasi warna, ukuran, dan model tidak boleh duplikat.");
    combinations.add(key);
  }
  if (input.useManualRate && !input.manualRate) throw new Error("Kurs manual wajib lebih dari 0.");

  const latestStoredRate = input.useManualRate ? null : await getStoredCnyRate();
  // Preserve a valid product snapshot on edit. Legacy snapshots of 0 are never valid.
  const appliedStoredRate = input.useManualRate ? null : (input.useLatestRate ? [latestStoredRate] : [productRateSnapshot, latestStoredRate]).find((rate) => rate && isValidRate(rate.marketRate)) ?? null;
  if (!input.useManualRate && !appliedStoredRate) throw new Error("Kurs Jual BI CNY/IDR belum tersedia.");

  const exchangeRate = new Prisma.Decimal(input.manualRate ?? appliedStoredRate!.marketRate);
  if (!exchangeRate.isFinite() || exchangeRate.lessThanOrEqualTo(0)) throw new Error("Kurs Jual BI CNY/IDR tidak valid.");

  const pricing = calculateProductPricing({ purchasePriceCny: input.originalPrice, exchangeRate, chinaShipping: input.chinaShipping, internationalShipping: input.internationalShipping, tax: input.tax, additionalCost: input.additionalCost, marginType: input.marginType, marginPercentage: input.marginPercentage, marginFixed: input.marginFixed, roundingType: input.roundingType });
  if (!pricing.totalCost.isFinite() || pricing.totalCost.lessThan(0) || !pricing.profit.isFinite() || pricing.profit.lessThan(0) || !pricing.finalSellingPrice.isFinite() || pricing.finalSellingPrice.lessThanOrEqualTo(0)) throw new Error("Perhitungan harga produk tidak valid.");

  return {
    input,
    data: {
      originalPrice: new Prisma.Decimal(input.originalPrice), exchangeRate, exchangeRateSource: input.useManualRate ? "MANUAL" : appliedStoredRate!.provider ?? "Bank Indonesia — Kurs Transaksi BI", exchangeRateDate: input.useManualRate ? new Date() : appliedStoredRate!.sourceDate ?? appliedStoredRate!.fetchedAt ?? new Date(),
      useManualRate: input.useManualRate, chinaShipping: new Prisma.Decimal(input.chinaShipping), internationalShipping: new Prisma.Decimal(input.internationalShipping), tax: new Prisma.Decimal(input.tax), additionalCost: new Prisma.Decimal(input.additionalCost), totalCost: pricing.totalCost, marginType: input.marginType, marginPercentage: input.marginType === MarginType.FIXED ? null : new Prisma.Decimal(input.marginPercentage ?? 0), marginFixed: input.marginType === MarginType.PERCENTAGE ? null : new Prisma.Decimal(input.marginFixed ?? 0), profit: pricing.profit, calculatedSellingPrice: pricing.calculatedSellingPrice, sellingPrice: pricing.finalSellingPrice, roundingType: input.roundingType, stock: input.stock, featured: input.featured, status: input.status,
    },
  };
}
