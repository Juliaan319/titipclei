"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Loader2 } from "lucide-react";

export function AdminOrderStatusUpdater({ 
  orderId, 
  currentStatus, 
  trackingHistory 
}: { 
  orderId: string;
  currentStatus: string;
  trackingHistory: { id: string; status: string; createdAt: Date; description?: string | null; courier?: string | null; trackingNumber?: string | null; location?: string | null }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [description, setDescription] = useState("");
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [location, setLocation] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const handleUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (e && status === "CANCELLED") { setConfirming(true); return; }
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          description,
          courier,
          trackingNumber,
          location
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal mengupdate status");
      }

      setDescription("");
      setCourier("");
      setTrackingNumber("");
      setLocation("");
      router.refresh();
      setNotice("Status berhasil diperbarui."); setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8"><ConfirmDialog open={confirming} onClose={() => setConfirming(false)} onConfirm={() => void handleUpdate()} busy={loading} title="Batalkan pesanan?" description="Pesanan akan dibatalkan dan kode pembayaran aktif dilepas. Pembayaran terverifikasi harus ditangani melalui pengembalian dana secara terpisah." />{notice && <p role="status">{notice}</p>}
      <div>
        <form onSubmit={handleUpdate} className="space-y-4">
          <label className="block text-sm font-semibold">
            Status Baru
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)} 
              className="field mt-2 w-full"
            >
              <option value={currentStatus} disabled>{currentStatus}</option>
              <option value="PURCHASING">Barang Sedang Dipesan</option>
              <option value="PURCHASED">Barang Sudah Dibeli</option>
              <option value="CHECKING_ITEM">Menunggu Pengiriman</option>
              <option value="INTERNATIONAL_SHIPPING">Dalam Pengiriman ke Indonesia</option>
              <option value="ARRIVED_INDONESIA">Tiba di Indonesia</option><option value="DOMESTIC_SHIPPING">Dalam Pengiriman ke Alamat</option>
              <option value="COMPLETED">Selesai</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Pesan / Keterangan Tambahan
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field mt-2 w-full min-h-24"
              placeholder="Cth: Barang sedang diproses oleh pihak kargo di Guangzhou..."
            />
          </label>

          {(status === "INTERNATIONAL_SHIPPING" || status === "DOMESTIC_SHIPPING") && (
            <div className="space-y-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
              <p className="font-semibold text-sm">Informasi Pengiriman</p>
              <label className="block text-sm font-semibold text-slate-700">
                Kurir
                <input 
                  value={courier} 
                  onChange={(e) => setCourier(e.target.value)} 
                  className="field mt-2 w-full" 
                  placeholder="Cth: JNE, J&T, Kargo Udara"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Nomor Resi / Tracking ID
                <input 
                  value={trackingNumber} 
                  onChange={(e) => setTrackingNumber(e.target.value)} 
                  className="field mt-2 w-full" 
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Lokasi Saat Ini
                <input 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  className="field mt-2 w-full" 
                />
              </label>
            </div>
          )}

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update Status
          </button>
        </form>
      </div>

      <div>
        <h3 className="font-bold mb-4">Riwayat Tracking</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {trackingHistory.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada riwayat update.</p>
          ) : (
            trackingHistory.map((track) => (
              <div key={track.id} className="rounded-xl border border-slate-200 p-4 text-sm relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-rose-500" />
                <p className="font-bold">{track.status}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(track.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                {track.description && (
                  <p className="mt-2 text-slate-700">{track.description}</p>
                )}
                {(track.courier || track.trackingNumber) && (
                  <div className="mt-2 p-2 bg-slate-50 rounded text-xs font-mono">
                    {track.courier && <div>Kurir: {track.courier}</div>}
                    {track.trackingNumber && <div>Resi: {track.trackingNumber}</div>}
                    {track.location && <div>Lokasi: {track.location}</div>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
