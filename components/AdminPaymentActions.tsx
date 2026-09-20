"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AdminPaymentDeleteButton } from "@/components/AdminPaymentDeleteButton";

export function AdminPaymentActions({ paymentId }: { paymentId: string }) {
  const router = useRouter(); const [action, setAction] = useState<"verify" | "reject" | null>(null); const [saving, setSaving] = useState(false); const [reason, setReason] = useState(""); const [message, setMessage] = useState("");
  async function update() { if (!action || saving) return; setSaving(true); setMessage(""); try { const res = await fetch(`/api/admin/payments/${paymentId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setAction(null); setMessage("Pembayaran berhasil diperbarui."); router.refresh(); } catch (err) { setMessage(err instanceof Error ? err.message : "Silakan coba lagi."); } finally { setSaving(false); } }
  return <div><div className="flex flex-wrap gap-2"><button className="btn-secondary" disabled={saving} onClick={() => setAction("reject")}>Tolak</button><button className="btn-primary" disabled={saving} onClick={() => setAction("verify")}>Terima</button><AdminPaymentDeleteButton paymentId={paymentId}/></div><p role="status" className="mt-2 text-xs">{message}</p><ConfirmDialog open={!!action} onClose={() => setAction(null)} onConfirm={update} busy={saving} title={action === "verify" ? "Terima pembayaran?" : "Tolak pembayaran?"} description={action === "verify" ? "Pastikan transfer sesuai nominal dan bukti. Pesanan akan masuk proses pembelian." : "Kode unik akan dilepas. Pelanggan dapat membuat nominal baru."}>{action === "reject" && <label className="form-label">Alasan penolakan<textarea maxLength={500} className="field mt-2" value={reason} onChange={e => setReason(e.target.value)} /></label>}</ConfirmDialog></div>;
}
