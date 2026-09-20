"use client";
import { useEffect, useRef, useState } from "react";
import { UploadCloud, Check } from "lucide-react";
import { useRouter } from "next/navigation";
export function PaymentForm({ orderId }: { orderId: string; accountNumber?: string }) {
  const [proof, setProof] = useState<File | null>(null); const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!proof || saving) return; setSaving(true); setError("");
    try { const form = new FormData(e.currentTarget); form.set("proof", proof); const response = await fetch(`/api/payments/${orderId}/proof`, { method: "POST", body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error); window.location.assign(data.redirectTo); }
    catch (err) { setError(err instanceof Error ? err.message : "Bukti gagal dikirim. Silakan coba lagi."); } finally { setSaving(false); }
  }
  const [dragging, setDragging] = useState(false);
  function selectFile(file?: File) {
    if (!file || saving) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024) {
      setError("Pilih JPG, JPEG, PNG, atau WEBP maksimal 10 MB, dengan isi gambar yang valid.");
      if (input.current) input.current.value = "";
      return;
    }
    setError(""); setProof(file); setPreview(URL.createObjectURL(file));
  }
  return <form onSubmit={submit} className="panel space-y-5"><h2 className="text-lg font-semibold">Unggah bukti transfer</h2><p className="text-sm leading-6 text-muted-foreground">Pastikan nominal transfer sesuai dengan total pembayaran.</p>
    <label className="form-label">Nama pengirim<input name="senderName" maxLength={120} disabled={saving} className="field mt-2" /></label>
    <label className="form-label">Catatan (opsional)<textarea name="notes" maxLength={500} disabled={saving} className="field mt-2 min-h-24" /></label>
    <input ref={input} aria-label="Bukti pembayaran" type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} className="hidden" onChange={e => selectFile(e.target.files?.[0])} />
    <div onDragOver={e => { e.preventDefault(); if (!saving) setDragging(true); }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }} onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length > 1) { setError("Pilih satu bukti pembayaran saja."); return; } selectFile(e.dataTransfer.files[0]); }} className={`rounded-xl border-[1.5px] border-dashed transition-colors ${dragging ? "border-[#B74F68] bg-[#FFF7F7]" : "border-[#DDBCB8] bg-[#FFFDFC]"}`}>
      {proof ? <div className="p-4"><div className="flex items-center gap-4"><img src={preview} alt="Pratinjau bukti pembayaran" className="h-24 w-24 shrink-0 rounded-lg bg-white object-contain" /><div className="min-w-0"><p className="break-words text-sm font-semibold">{proof.name}</p><p className="mt-1 text-sm text-muted-foreground">{(proof.size / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 2 })} MB</p></div></div><div className="mt-4 flex gap-3"><button type="button" disabled={saving} className="btn-secondary" onClick={() => input.current?.click()}>Ganti</button><button type="button" disabled={saving} className="btn-secondary text-destructive" onClick={() => { setProof(null); setPreview(""); setError(""); if (input.current) input.current.value = ""; }}>Hapus</button></div>{dragging && <p role="status" className="mt-3 text-sm text-[#B74F68]">Lepaskan untuk mengganti gambar</p>}</div> : <button type="button" disabled={saving} onClick={() => input.current?.click()} className="group flex min-h-[180px] w-full cursor-pointer flex-col items-center justify-center rounded-xl p-5 text-center transition-colors hover:bg-[#FFF7F7] hover:ring-1 hover:ring-[#B74F68] focus-visible:outline-2 focus-visible:outline-[#B74F68]"><UploadCloud className="mb-3 size-8 text-[#AA7B78] transition-colors group-hover:text-[#B74F68]" /><span className="text-base font-semibold">{dragging ? "Lepaskan gambar di sini" : "Unggah bukti transfer"}</span><span className="mt-2 text-sm text-muted-foreground">Klik untuk memilih file atau tarik file ke area ini</span><span className="mt-3 text-sm text-muted-foreground">JPG, JPEG, PNG, WEBP &bull; maks. 10 MB</span></button>}
    </div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button disabled={saving || !proof} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#B74F68] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A8435B] disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Mengunggah…" : "Kirim bukti pembayaran"}</button></form>;
}
export function ReservePaymentButton({ token }: { token: string }) {
  const router = useRouter(); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function reserve() { setSaving(true); setError(""); try { const res = await fetch(`/api/payments/${token}/reserve`, { method: "POST" }); const data = await res.json(); if (!res.ok) throw new Error(data.error); router.refresh(); } catch (err) { setError(err instanceof Error ? err.message : "Silakan coba lagi."); } finally { setSaving(false); } }
  return <div><button className="btn-primary" disabled={saving} onClick={reserve}>{saving ? "Menyiapkan…" : "Buat nominal pembayaran"}</button>{error && <p role="alert" className="mt-3 text-destructive">{error}</p>}</div>;
}
export function CopyButton({ value, label = "Salin nomor rekening" }: { value: string; label?: string }) {
  const [message, setMessage] = useState("");
  return <div><button type="button" className="btn-secondary mt-3" onClick={async () => { try { await navigator.clipboard.writeText(value); setMessage("Tersalin"); } catch { setMessage("Tidak dapat menyalin. Salin nomor secara manual."); } }}>{message === "Tersalin" ? <><Check size={16} /> Tersalin</> : label}</button><span role="status" className="mt-2 block text-sm">{message}</span></div>;
}
