import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/require-admin";
import { AdminProductForm } from "@/components/AdminProductForm";
import { getStoredCnyRate } from "@/lib/exchange-rate/get-cny-rate";
import { CNY_SELL_RATE, CNY_SELL_RATE_AS_OF } from "@/lib/exchange-rate/rates";

const positiveRate = (value: unknown, fallback = CNY_SELL_RATE) => {
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : fallback;
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const [product, categories, stored] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          include: { images: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getStoredCnyRate(),
  ]);
  if (!product) notFound();

  const date = stored?.sourceDate ?? stored?.fetchedAt;
  const latestRate = {
    rate: positiveRate(stored?.marketRate),
    asOf: date?.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) ?? CNY_SELL_RATE_AS_OF,
    provider: stored?.provider ?? "Bank Indonesia — Kurs Transaksi BI",
    status: stored ? "Data terbaru tersedia" : "Menggunakan Data Terakhir",
    fallback: !stored,
  };
  const text = (value: { toString(): string } | number | null | undefined, fallback = "0") => value?.toString() ?? fallback;
  const snapshotRate = positiveRate(product.exchangeRate, latestRate.rate);

  // Send only serializable form fields to the Client Component; Prisma Decimal values cannot cross this boundary.
  const formProduct = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description,
    categoryId: product.categoryId,
    imageUrl: product.imageUrl,
    imageUrls: product.images.map((image) => image.imageUrl),
    status: product.status,
    originalPrice: text(product.originalPrice),
    exchangeRate: String(snapshotRate),
    useManualRate: product.useManualRate,
    chinaShipping: text(product.chinaShipping),
    internationalShipping: text(product.internationalShipping),
    tax: text(product.tax),
    additionalCost: text(product.additionalCost),
    marginType: product.marginType,
    marginPercentage: text(product.marginPercentage, "10"),
    marginFixed: text(product.marginFixed),
    roundingType: product.roundingType,
    stock: product.stock,
    featured: product.featured,
    variants: product.variants.map((v) => ({
      id: v.id,
      status: v.status,
      name: v.name || "",
      colorName: v.colorName || "",
      colorHex: v.colorHex || "",
      size: v.size || "",
      model: v.model || "",
      stock: String(v.stock),
      priceAdjustment: text(v.priceAdjustment),
      images: v.images.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => img.imageUrl),
    })),
  };

  return <div className="mx-auto max-w-7xl"><Link href="/admin/products" className="text-sm font-semibold text-rose-600">← Kembali</Link><h1 className="mt-4 text-3xl font-bold">Edit Produk</h1><p className="mt-2 text-sm text-slate-500">Kurs saat produk dibuat: Rp{snapshotRate.toLocaleString("id-ID")} · Kurs BI terbaru: Rp{latestRate.rate.toLocaleString("id-ID")}</p><AdminProductForm categories={categories} rate={latestRate} product={formProduct} /></div>;
}
