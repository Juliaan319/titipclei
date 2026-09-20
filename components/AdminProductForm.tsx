"use client";

import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getProductImagesBrowserClient } from "@/lib/storage/product-images-client";
import { ProductVariantManager, type VariantData } from "./ProductVariantManager";

type Rate = {
  rate: number;
  asOf: string;
  provider: string;
  status: string;
  fallback?: boolean;
};
type Product = {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  categoryId: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
  status: string;
  originalPrice: string | number;
  exchangeRate: string | number;
  useManualRate: boolean;
  chinaShipping: string | number;
  internationalShipping: string | number;
  tax: string | number;
  additionalCost: string | number;
  marginType: "PERCENTAGE" | "FIXED" | "PERCENTAGE_PLUS_FIXED";
  marginPercentage: string | number | null;
  marginFixed: string | number | null;
  roundingType: "NONE" | "ROUND_1000" | "ROUND_5000" | "ROUND_10000";
  stock: number;
  featured: boolean;
  variants?: VariantData[];
};
type ImageInfo = { name: string; size: number | null };

const MAX_IMAGE_SIZE = 100 * 1024 * 1024;
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const idr = (value: number) => `Rp${Math.round(value).toLocaleString("id-ID")}`;
const cny = (value: number) =>
  `¥${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}`;
const number = (value: string | number | null | undefined) =>
  Number(value ?? 0) || 0;
const fileSize = (value: number | null) =>
  value === null
    ? ""
    : value >= 1024 * 1024
      ? `${(value / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(value / 1024))} KB`;

export function AdminProductForm({
  categories,
  rate: initialRate,
  product,
}: {
  categories: { id: string; name: string }[];
  rate: Rate;
  product?: Product;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || "");
  const [imageUrls, setImageUrls] = useState<string[]>(product?.imageUrls || (product?.imageUrl ? [product.imageUrl] : []));
  const [, setPreviewUrl] = useState(product?.imageUrl || "");
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(
    product?.imageUrl ? { name: "Gambar produk tersimpan", size: null } : null,
  );
  const [rate, setRate] = useState(() =>
    product && !product.useManualRate
      ? {
          ...initialRate,
          rate: number(product.exchangeRate),
          asOf: "Kurs saat produk dibuat",
          provider: "Snapshot kurs produk",
          status: "Kurs tersimpan",
          fallback: false,
        }
      : initialRate,
  );
  const [values, setValues] = useState({
    originalPrice: String(product?.originalPrice ?? ""),
    chinaShipping: String(product?.chinaShipping ?? 0),
    internationalShipping: String(product?.internationalShipping ?? 0),
    tax: String(product?.tax ?? 0),
    additionalCost: String(product?.additionalCost ?? 0),
    marginType: product?.marginType ?? "PERCENTAGE",
    marginPercentage: String(product?.marginPercentage ?? 10),
    marginFixed: String(product?.marginFixed ?? 0),
    roundingType: product?.roundingType ?? "ROUND_5000",
    useManualRate: product?.useManualRate ?? false,
    useLatestRate: false,
    manualRate: String(product?.useManualRate ? product.exchangeRate : ""),
  });
  const [variants, setVariants] = useState<VariantData[]>(product?.variants || []);

  const update = (key: keyof typeof values, value: string | boolean) =>
    setValues((current) => ({ ...current, [key]: value }));
  const appliedRate = values.useManualRate
    ? number(values.manualRate)
    : number(rate.rate);
  const preview = useMemo(() => {
    const purchase = number(values.originalPrice) * appliedRate;
    const total =
      purchase + number(values.chinaShipping) +
      number(values.internationalShipping) +
      number(values.tax) +
      number(values.additionalCost);
    const percentageProfit = (total * number(values.marginPercentage)) / 100;
    const profit =
      values.marginType === "PERCENTAGE"
        ? percentageProfit
        : values.marginType === "FIXED"
          ? number(values.marginFixed)
          : percentageProfit + number(values.marginFixed);
    const raw = total + profit;
    const round =
      values.roundingType === "ROUND_1000"
        ? 1000
        : values.roundingType === "ROUND_5000"
          ? 5000
          : values.roundingType === "ROUND_10000"
            ? 10000
            : 1;
    const final = round === 1 ? Math.round(raw) : Math.ceil(raw / round) * round;
    return { purchase, total, profit: final - total, final };
  }, [values, appliedRate]);

  async function refreshRate() {
    setNotice("");
    setError("");
    const response = await fetch("/api/admin/exchange-rates/cny/refresh", {
      method: "POST",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok)
      return setError(data?.error || "Gagal memperbarui kurs BI.");
    const refreshedRate = number(data?.rate);
    if (refreshedRate <= 0)
      return setError(
        "Kurs terakhir tidak valid. Gunakan kurs manual atau coba lagi.",
      );
    update("useLatestRate", true);
    setRate({
      rate: refreshedRate,
      asOf:
        data?.asOf ||
        (data?.sourceDate
          ? new Date(data.sourceDate).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : rate.asOf),
      provider: "Bank Indonesia — Kurs Transaksi BI",
      status: data?.fallback
        ? "Menggunakan Data Terakhir"
        : "Data terbaru tersedia",
      fallback: Boolean(data?.fallback),
    });
    setNotice(
      data?.fallback
        ? data.message
        : data.unchanged
          ? "Kurs sudah menggunakan data BI terbaru."
          : "Kurs Bank Indonesia berhasil diperbarui.",
    );
  }

  async function uploadImage(file: File) {
    if (!IMAGE_TYPES.has(file.type))
      return setError(
        "Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau AVIF.",
      );
    if (file.size > MAX_IMAGE_SIZE)
      return setError("Ukuran gambar maksimal 100 MB.");
    setError("");
    setNotice("");
    setSelectedFile(file);
    setImageInfo({ name: file.name, size: file.size });
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const sign = await fetch("/api/admin/product-images/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          productId: product?.id,
        }),
      });
      const signed = await sign.json().catch(() => null);
      if (!sign.ok)
        throw new Error(signed?.error || "Gagal menyiapkan upload gambar.");
      const { error: uploadError } = await getProductImagesBrowserClient()
        .storage.from(signed.bucket)
        .uploadToSignedUrl(signed.key, signed.token, file, {
          contentType: file.type,
          cacheControl: "3600",
        });
      if (uploadError) throw uploadError;
      setImageUrl((current) => current || signed.url);
      setImageUrls((current) => [...current, signed.url]);
      setPreviewUrl(signed.url);
      setNotice("Gambar berhasil diupload.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal mengupload gambar. Silakan coba lagi.",
      );
    } finally {
      setUploading(false);
    }
  }

  function chooseImage(file?: File) {
    if (file) void uploadImage(file);
  }
  function removeImage() {
    setImageUrl(""); setImageUrls([]);
    setPreviewUrl("");
    setImageInfo(null);
    setSelectedFile(null);
    setNotice("Gambar akan dihapus saat produk disimpan.");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading)
      return setError("Tunggu upload gambar selesai terlebih dahulu.");
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try { const response = await fetch(
      product ? `/api/admin/products/${product.id}` : "/api/admin/products",
      {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          brand: form.get("brand"),
          categoryId: form.get("categoryId") || null,
          imageUrl,
          imageUrls,
          description: form.get("description"),
          status: form.get("status"),
          stock: form.get("stock"),
          featured: form.get("featured") === "on",
          variants,
          ...values,
        }),
      },
    );
    const result = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok)
      return setError(result?.error || "Gagal menyimpan produk.");
    router.replace("/admin/products");
    router.refresh();
    } catch { setError("Koneksi terputus. Silakan coba lagi."); } finally { setSaving(false); }
  }

  const amountInput = (
    label: string,
    key: "chinaShipping" | "internationalShipping" | "tax" | "additionalCost",
  ) => (
    <label className="block text-sm font-semibold">
      {label} (Opsional)
      <input
        value={values[key]}
        onChange={(event) => update(key, event.target.value)}
        type="number"
        min="0"
        step="1"
        className="field mt-2"
      />
      <span className="mt-1 block text-xs font-normal text-slate-500">IDR</span>
    </label>
  );

  return (
    <form
      onSubmit={submit}
      className="mt-7 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="space-y-6">
        <section className="space-y-4 rounded-xl border bg-white p-6">
          <div>
            <h2 className="text-lg font-bold">Informasi Produk</h2>
            <p className="text-sm text-slate-500">
              Data yang akan tampil di katalog pelanggan.
            </p>
          </div>
          <label className="block text-sm font-semibold">
            Nama Produk
            <input
              required
              name="name"
              defaultValue={product?.name}
              className="field mt-2"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Brand
              <input
                name="brand"
                defaultValue={product?.brand || ""}
                className="field mt-2"
              />
            </label>
            <label className="block text-sm font-semibold">
              Kategori
              <select
                name="categoryId"
                defaultValue={product?.categoryId || ""}
                className="field mt-2"
              >
                <option value="">Other</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <p className="text-sm font-semibold">Foto Produk</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(event) => chooseImage(event.target.files?.[0])}
            />
            {imageUrls.length ? (
              <div className="mt-2 overflow-hidden rounded-xl border bg-slate-50 p-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{imageUrls.map((url, index) => <div key={url} className="relative"><img src={url} alt={`Foto produk ${index + 1}`} className="h-28 w-full rounded-lg object-cover" />{index === 0 && <span className="absolute left-2 top-2 rounded-full bg-[#6F4A45] px-2 py-1 text-[10px] font-bold text-white">Utama</span>}<div className="mt-1 flex gap-1"><button type="button" disabled={index === 0} onClick={() => setImageUrls((items) => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setImageUrl(next[0]); return next; })} className="text-xs text-[#6F4A45] disabled:opacity-30">←</button><button type="button" onClick={() => setImageUrls((items) => { const next = items.filter((_, i) => i !== index); setImageUrl(next[0] || ""); return next; })} className="text-xs text-rose-600">Hapus</button></div></div>)}</div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {imageInfo?.name || "Gambar produk"}
                    </p>
                    {imageInfo?.size !== null && (
                      <p className="text-xs text-slate-500">
                        {fileSize(imageInfo?.size ?? null)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="rounded-lg border px-3 py-2 text-xs font-semibold"
                    >
                      Tambah Foto
                    </button>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus Semua
                    </button>
                  </div>
                </div>
                {uploading && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-rose-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengupload...
                  </p>
                )}
                {error && selectedFile && (
                  <button
                    type="button"
                    onClick={() => void uploadImage(selectedFile)}
                    className="mt-2 text-sm font-semibold text-rose-600"
                  >
                    Coba Lagi
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  chooseImage(event.dataTransfer.files[0]);
                }}
                className={`mt-2 flex min-h-48 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50 hover:border-rose-300"}`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-rose-100 text-rose-700">
                  <Upload className="h-5 w-5" />
                </span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-rose-700">
                  <ImagePlus className="h-4 w-4" />
                  Import Gambar
                </span>
                <span className="mt-2 text-sm text-slate-600">
                  Klik atau tarik gambar ke sini
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  JPG, PNG, WEBP, AVIF · Maksimal 100 MB
                </span>
              </button>
            )}
          </div>
          <label className="block text-sm font-semibold">
            Deskripsi
            <textarea
              name="description"
              defaultValue={product?.description || ""}
              className="field mt-2 min-h-28"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-semibold">
              Status
              <select
                name="status"
                defaultValue={product?.status || "OPEN"}
                className="field mt-2"
              >
                <option value="OPEN">Open Jastip</option>
                <option value="CLOSING_SOON">Segera tutup</option>
                <option value="CLOSED">Tidak aktif</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm font-semibold">
              <input
                name="featured"
                type="checkbox"
                defaultChecked={product?.featured}
              />{" "}
              Tampilkan di Beranda
            </label>
          </div>
        </section>
        <ProductVariantManager variants={variants} onChange={setVariants} productId={product?.id} />
        <section className="space-y-5 rounded-xl border border-rose-100 bg-white p-6">
          <div>
            <h2 className="text-lg font-bold">Harga & Margin</h2>
            <p className="text-sm text-slate-500">
              Pratinjau dihitung langsung, lalu dihitung ulang dengan aman saat
              produk disimpan.
            </p>
          </div>
          {rate.fallback && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Bank Indonesia sementara tidak dapat dihubungi. Menggunakan kurs
              terakhir yang tersimpan.
            </p>
          )}
          <label className="block text-sm font-semibold">
            Harga Beli
            <input
              required
              value={values.originalPrice}
              onChange={(event) => update("originalPrice", event.target.value)}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="699"
              className="field mt-2"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              CNY / ¥ · {cny(number(values.originalPrice))}
            </span>
          </label>
          <div className="rounded-xl bg-rose-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Kurs Jual BI CNY/IDR</p>
                <p className="mt-1 text-xl font-bold text-rose-700">
                  1 CNY = {idr(appliedRate)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {values.useManualRate ? "Kurs Manual" : rate.provider} ·
                  Update BI: {rate.asOf}
                </p>
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  {values.useManualRate ? "Kurs Manual" : rate.status}
                </p>
              </div>
              <button
                type="button"
                onClick={refreshRate}
                className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700"
              >
                Perbarui Kurs
              </button>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <input
                checked={values.useManualRate}
                onChange={(event) =>
                  update("useManualRate", event.target.checked)
                }
                type="checkbox"
              />{" "}
              Gunakan Kurs Manual
            </label>
            {values.useManualRate && (
              <>
                <input
                  value={values.manualRate}
                  onChange={(event) => update("manualRate", event.target.value)}
                  type="number"
                  min="0.01"
                  step="0.0001"
                  placeholder="Kurs manual"
                  className="field mt-2"
                />
                <p className="mt-1 text-xs text-amber-700">
                  Kurs manual akan menggantikan Kurs Jual BI untuk produk ini.
                </p>
              </>
            )}
          </div>
          <div className="rounded-xl border bg-slate-50 p-4 text-sm">
            <p className="font-semibold">Modal Barang</p>
            <p className="mt-1 text-slate-600">
              {cny(number(values.originalPrice))} × {idr(appliedRate)}
            </p>
            <p className="mt-1 text-lg font-bold">{idr(preview.purchase)}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {amountInput(
              "Biaya Pengiriman China → Indonesia",
              "internationalShipping",
            )}
            {amountInput("Ongkir lokal China (IDR)", "chinaShipping")}
            {amountInput("Pajak / Bea", "tax")}
            {amountInput("Biaya Tambahan", "additionalCost")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Jenis Margin
              <select
                value={values.marginType}
                onChange={(event) => update("marginType", event.target.value)}
                className="field mt-2"
              >
                <option value="PERCENTAGE">Persentase</option>
                <option value="FIXED">Nominal Tetap</option>
                <option value="PERCENTAGE_PLUS_FIXED">
                  Persentase + Nominal
                </option>
              </select>
            </label>
            {values.marginType !== "FIXED" && (
              <label className="block text-sm font-semibold">
                Margin
                <input
                  value={values.marginPercentage}
                  onChange={(event) =>
                    update("marginPercentage", event.target.value)
                  }
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="field mt-2"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  %
                </span>
              </label>
            )}
            {values.marginType !== "PERCENTAGE" && (
              <label className="block text-sm font-semibold">
                Margin Nominal
                <input
                  value={values.marginFixed}
                  onChange={(event) =>
                    update("marginFixed", event.target.value)
                  }
                  type="number"
                  min="0"
                  step="1"
                  className="field mt-2"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  IDR
                </span>
              </label>
            )}
          </div>
          <label className="block text-sm font-semibold">
            Pembulatan Harga
            <select
              value={values.roundingType}
              onChange={(event) => update("roundingType", event.target.value)}
              className="field mt-2"
            >
              <option value="NONE">Tidak Dibulatkan</option>
              <option value="ROUND_1000">Ke Rp1.000</option>
              <option value="ROUND_5000">Ke Rp5.000</option>
              <option value="ROUND_10000">Ke Rp10.000</option>
            </select>
          </label>
        </section>
        {error && (
          <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
            {notice}
          </p>
        )}
      </div>
      <aside className="h-fit rounded-xl border bg-white p-6 lg:sticky lg:top-6">
        <h2 className="text-lg font-bold">Ringkasan Harga</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <Row label="Harga Beli" value={cny(number(values.originalPrice))} />
          <Row label="Kurs Jual BI" value={idr(appliedRate)} />
          <Row label="Modal Barang" value={idr(preview.purchase)} />
          <Row
            label="Biaya Tambahan"
            value={idr(
              number(values.internationalShipping) +
                number(values.tax) +
                number(values.additionalCost),
            )}
          />
          <Row label="Total Modal" value={idr(preview.total)} strong />
          <Row label="Profit" value={idr(preview.profit)} strong />
        </dl>
        <div className="mt-5 border-t pt-5">
          <p className="text-sm font-semibold text-slate-600">
            Harga Jual ke Customer
          </p>
          <p className="mt-1 text-3xl font-extrabold text-rose-700">
            {idr(preview.final)}
          </p>
        </div>
        <button
          disabled={saving || uploading}
          className="mt-6 w-full rounded-xl bg-[#D98392] px-5 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-[#C86D7D] active:bg-[#B95F70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB5C0] focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {uploading
            ? "Mengupload gambar..."
            : saving
              ? "Menyimpan..."
              : "Simpan Produk"}
        </button>
      </aside>
    </form>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={strong ? "font-bold" : "font-medium"}>{value}</dd>
    </div>
  );
}
