"use client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function AdminPaymentDeleteButton({ paymentId }: { paymentId: string }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function remove() { setBusy(true); setError(""); try { const response = await fetch(`/api/admin/payments/${paymentId}`, { method: "DELETE" }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.error || "Pembayaran gagal dihapus."); setOpen(false); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Pembayaran gagal dihapus."); } finally { setBusy(false); } }
  return <><button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-700" onClick={() => setOpen(true)}><Trash2 className="h-4 w-4" />Hapus</button>{error && <p className="mt-1 text-xs text-rose-600">{error}</p>}<ConfirmDialog open={open} onClose={() => setOpen(false)} onConfirm={remove} busy={busy} title="Hapus pembayaran?" description="Data pembayaran dan histori percobaan transfer akan dihapus. Pesanan dikembalikan ke menunggu pembayaran." /></>;
}
