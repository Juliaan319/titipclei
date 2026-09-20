"use client";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
export function ConfirmDialog({ open, onClose, onConfirm, title, description, busy = false, children }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; busy?: boolean; children?: React.ReactNode }) {
  return <Dialog open={open} onOpenChange={value => { if (!value && !busy) onClose(); }}><DialogContent><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription>{children}<DialogFooter><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>Kembali</button><button type="button" className="btn-primary" disabled={busy} onClick={onConfirm}>{busy ? "Memproses?" : "Konfirmasi"}</button></DialogFooter></DialogContent></Dialog>;
}
