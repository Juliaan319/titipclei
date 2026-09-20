"use client";
import { useState } from "react";

export function CopyQuotationLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return <button onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}${link}`); setCopied(true); }} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700">{copied ? "Link Tersalin" : "Salin Link Penawaran"}</button>;
}
