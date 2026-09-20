"use client";
import { useState } from "react";
import { PackageCheck, Search } from "lucide-react";

import { OrderStatusCard } from "@/components/order-status/OrderStatusCard";
import { ProgressTimeline } from "@/components/order-status/ProgressTimeline";
import { getPaymentStatus, getOrderStatus } from "@/lib/order-status";

type Result = {
  orderNumber: string;
  customerName?: string;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  productName?: string;
  tracking: { status: string; description?: string; createdAt: string }[];
};

export default function TrackPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: data.get("code"),
        phone: data.get("phone"),
      }),
    });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) setError(body.error);
    else setResult(body.order);
  };
  return (
    <main className="min-h-screen bg-[#FFF9F5] py-12">
      <div className="mx-auto max-w-2xl px-4">
        {!result && (
          <div className="rounded-xl border border-[#E8D8D1] bg-white p-7 shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F6E4E8] text-[#A84F63]">
              <PackageCheck className="h-5 w-5" />
            </span>
            <h1 className="mt-5 text-3xl font-bold text-[#4B342F]">
              Cek Status Pesanan
            </h1>
            <p className="mt-2 text-slate-600">
              Masukkan kode pesanan dan nomor WhatsApp untuk melihat status
              pesananmu.
            </p>
            <form onSubmit={submit} className="mt-7 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Kode Pesanan
                <input
                  required
                  name="code"
                  placeholder="JH-CN-A8K29D"
                  className="field mt-2 uppercase"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Nomor WhatsApp
                <input
                  required
                  name="phone"
                  placeholder="081234567890"
                  className="field mt-2"
                />
              </label>
              <button
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A84F63] font-semibold text-white"
              >
                <Search className="h-4 w-4" />
                {loading ? "Memeriksa..." : "Cek Pesanan"}
              </button>
            </form>
            {error && (
              <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#4B342F]">
                {result.orderNumber}
              </h1>
              <button
                onClick={() => setResult(null)}
                className="text-sm font-medium text-rose-600 hover:underline"
              >
                Cek Resi Lain
              </button>
            </div>

            <OrderStatusCard
              status={result.orderStatus}
              paymentStatus={result.paymentStatus}
              orderNumber={result.orderNumber}
            />

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[#4B342F]">Detail Pesanan</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-slate-500">Pelanggan</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {result.customerName || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Produk</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {result.productName || "Pesanan Jastip"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Total Pembayaran</dt>
                  <dd className="mt-1 font-bold text-slate-900">
                    Rp {result.total.toLocaleString("id-ID")}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <dt className="text-slate-500 mb-1">Pembayaran</dt>
                    <dd>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPaymentStatus(result.paymentStatus).color.bg} ${getPaymentStatus(result.paymentStatus).color.text}`}>
                        {getPaymentStatus(result.paymentStatus).label}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 mb-1">Status Pesanan</dt>
                    <dd>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getOrderStatus(result.orderStatus).color.bg} ${getOrderStatus(result.orderStatus).color.text}`}>
                        {getOrderStatus(result.orderStatus).label}
                      </span>
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[#4B342F]">Proses Pesanan</h2>
              <ProgressTimeline currentStatus={result.orderStatus} />
            </div>

            {result.tracking && result.tracking.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-bold text-[#4B342F]">Riwayat Status</h2>
                <div className="mt-5 space-y-6">
                  {result.tracking.map((item, index) => {
                    const statusInfo = getOrderStatus(item.status);
                    const isLast = index === result.tracking.length - 1;
                    return (
                      <div key={item.createdAt} className="relative flex gap-4">
                        {!isLast && (
                          <div className="absolute left-[11px] top-7 bottom-[-24px] w-0.5 bg-slate-100" />
                        )}
                        <div className="relative mt-1">
                          <div className={`grid h-6 w-6 place-items-center rounded-full bg-white ring-2 ring-slate-100`}>
                            <div className="h-2 w-2 rounded-full bg-slate-300" />
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {statusInfo.headline || item.status}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                          {item.description && (
                            <p className="mt-2 text-sm text-slate-600">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
