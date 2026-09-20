"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin page render failed", { operation: "render", name: error.name, message: error.message, digest: error.digest });
  }, [error]);

  return <div className="mx-auto max-w-xl rounded-xl border border-[#E8D8D1] bg-[#FFFDFC] p-6 text-[#4B342F] shadow-sm"><h1 className="text-xl font-bold">Gagal memuat data admin.</h1><p className="mt-2 text-sm leading-6 text-[#8B716A]">Coba muat ulang halaman. Jika masalah berlanjut, periksa konfigurasi database dan migrasi di server.</p><button type="button" onClick={reset} className="mt-5 rounded-xl bg-[#D98392] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C86D7D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B342F]">Coba lagi</button></div>;
}
