import { ArrowUpRight } from "lucide-react";
export function InstagramHelp() {
  return <div className="mt-3 text-sm leading-6"><p className="text-muted-foreground">Ada pertanyaan tentang pesanan atau pembayaran? Hubungi Titip Clei melalui Instagram.</p><a href="https://www.instagram.com/titipclei/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-[#B74F68] hover:underline"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false" className="shrink-0"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg> @titipclei <ArrowUpRight size={16} /><span className="sr-only">(buka tab baru)</span></a></div>;
}

