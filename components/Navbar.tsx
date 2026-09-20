"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { brand } from "@/lib/brand";

const links = [{ name: "Beranda", href: "/" }, { name: "Produk", href: "/products" }, { name: "Cara Kerja", href: "/cara-kerja" }, { name: "Request Barang", href: "/request" }, { name: "Cek Pesanan", href: "/track" }];
export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { const update = () => setScrolled(window.scrollY > 20); update(); window.addEventListener("scroll", update, { passive: true }); return () => window.removeEventListener("scroll", update); }, []);
  const active = (href: string) => href === "/" ? pathname === "/" : (href === "/track" ? ["/track", "/orders", "/order/success", "/payment"].some(route => pathname === route || pathname.startsWith(`${route}/`)) : pathname === href || pathname.startsWith(`${href}/`));
  return <header className={`clei-navbar sticky top-0 z-50 border-b transition-colors duration-300 ${scrolled || open ? "border-[#ECD6D2] bg-[#FFF8F5]/95 shadow-sm backdrop-blur-md" : "border-transparent bg-[#FFF8F5]/90"}`} onKeyDown={e => { if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); } }}>
    <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-5 px-6 md:px-10 xl:px-16">
      <Link href="/" onClick={() => setOpen(false)} aria-label="Titip Clei — Beranda" className="relative h-16 w-44 shrink-0 sm:w-52"><Image src={brand.logo} alt="Titip Clei" fill sizes="208px" className="object-contain object-left" /></Link>
      <nav aria-label="Navigasi utama" className="hidden items-center gap-6 lg:flex">{links.map(link => <Link key={link.href} href={link.href} aria-current={active(link.href) ? "page" : undefined} className={`border-b py-2 text-sm font-medium transition-colors hover:text-[#B74F68] ${active(link.href) ? "border-[#B74F68] text-[#B74F68]" : "border-transparent text-[#55352F]"}`}>{link.name}</Link>)}</nav>
      <button ref={toggle} onClick={() => setOpen(!open)} className="rounded-lg p-2 text-[#55352F] lg:hidden" aria-label={open ? "Tutup menu" : "Buka menu"} aria-expanded={open} aria-controls="mobile-nav">{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav id="mobile-nav" aria-label="Navigasi mobile" className="absolute inset-x-0 top-full border-b border-[#ECD6D2] bg-[#FFF8F5] px-6 pb-5 shadow-sm lg:hidden">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={active(link.href) ? "page" : undefined} className={`block border-t border-[#ECD6D2]/60 py-3 text-sm font-medium ${active(link.href) ? "text-[#B74F68] underline decoration-1 underline-offset-8" : "text-[#55352F]"}`}>{link.name}</Link>)}</nav>}
  </header>;
}
