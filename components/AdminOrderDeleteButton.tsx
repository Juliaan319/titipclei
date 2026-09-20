"use client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function AdminOrderDeleteButton({ orderId }: { orderId: string }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function remove() { setBusy(true); setError(""); try { const response = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.error || "Pesanan gagal dihapus."); setOpen(false); router.push("/admin/orders?deleted=1"); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Pesanan gagal dihapus."); } finally { setBusy(false); } }
  return <><button type="button" className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setOpen(true)}><Trash2 className="h-4 w-4" />Hapus Pesanan</button>{error && <p className="mt-2 text-sm text-rose-600">{error}</p>}<ConfirmDialog open={open} onClose={() => setOpen(false)} onConfirm={remove} busy={busy} title="Hapus pesanan?" description="Pesanan, pembayaran, pengadaan, dan timeline terkait akan dihapus dari database dan tidak muncul lagi di panel admin." /></>;
}
