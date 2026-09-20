import Image from "next/image";
import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { ArrowRight, ShieldCheck, ClipboardCheck, PackageCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";
import "./home.css";

const editorial = Cormorant_Garamond({ subsets: ["latin"], weight: "600", display: "swap", variable: "--font-editorial" });
export const dynamic = "force-dynamic";
const steps = [
  ["Temukan Barang", "Cari barang incaranmu dari marketplace China favoritmu."],
  ["Kirim Link / Pilih Produk", "Pilih dari katalog atau kirim link, warna, ukuran, dan jumlah yang kamu mau."],
  ["Konfirmasi & Bayar", "Periksa harga dan detail pesanan, lalu transfer dan unggah bukti pembayaran."],
  ["Kami Beli dan Kirim", "Setelah pembayaran diverifikasi, kami bantu pembelian hingga pengiriman ke Indonesia."],
];
const benefits = [
  { icon: ShieldCheck, short: "Harga jelas di awal", title: "Harga disepakati di awal", text: "Ketahui harga sebelum barang dibeli." },
  { icon: ClipboardCheck, short: "Pilihan tercatat", title: "Pilihanmu tetap pilihanmu", text: "Warna, ukuran, dan detail tercatat dalam pesanan." },
  { icon: PackageCheck, short: "Proses bisa dipantau", title: "Proses bisa dipantau", text: "Ikuti perjalanan barang sampai tiba di alamatmu." },
];
const faqs = [
  ["Titip Clei bisa beli dari marketplace apa saja?", "Kamu bisa mengirim link dari Pinduoduo, Taobao, 1688, Shopee China, atau marketplace lainnya. Kami akan meninjau barang dan penjual sebelum memberikan penawaran."],
  ["Berapa lama pengiriman dari China?", "Waktu pengiriman mengikuti ketersediaan barang, proses penjual, dan perjalanan pengiriman. Pantau perkembangan pesanan melalui halaman Cek Pesanan."],
  ["Bagaimana cara menentukan harga?", "Katalog menampilkan harga jual dalam rupiah. Untuk request khusus, kamu menerima penawaran untuk diperiksa sebelum menyetujui pesanan. Nominal transfer dan kode unik ditampilkan terpisah saat pembayaran."],
  ["Apakah saya bisa memilih warna dan ukuran?", "Bisa. Pilih kombinasi yang tersedia pada halaman produk. Untuk request barang, tuliskan warna, ukuran, jumlah, dan detail yang kamu inginkan."],
  ["Bagaimana cara mengecek status pesanan?", "Buka Cek Pesanan, lalu masukkan nomor pesanan dan nomor WhatsApp pemesan untuk melihat perkembangan barangmu."],
  ["Apakah produk di katalog ready stock?", "Sebagian besar produk adalah contoh barang yang bisa dititip. Pembelian dilakukan setelah pesanan dikonfirmasi dan pembayaran diverifikasi."],
];

export default async function HomePage() {
  const products = await prisma.product.findMany({ where: { status: { not: "CLOSED" } }, include: { category: true }, take: 4, orderBy: [{ featured: "desc" }, { updatedAt: "desc" }] });
  return <div className={`clei-home ${editorial.variable}`}>
    <section className="clei-hero" aria-labelledby="hero-title">
      <div className="clei-hero-visual"><Image src="/background/background-titip-clei.webp" alt="" fill preload sizes="100vw" className="clei-hero-image" /></div>
      <div className="clei-container clei-hero-inner"><div className="clei-hero-copy">
        <p className="clei-eyebrow">Dari China, untuk keseharianmu</p>
        <h1 id="hero-title">Titip barang dari China<br /><span>jadi lebih mudah.</span></h1>
        <p className="clei-hero-description">Temukan barang yang kamu suka atau kirim link pilihanmu. Titip Clei membantu pembelian dari China hingga barang sampai ke tanganmu di Indonesia.</p>
        <div className="clei-actions"><Link className="clei-button" href="/products">Lihat Produk <ArrowRight size={18} aria-hidden="true" /></Link><Link className="clei-button clei-button-secondary" href="/request">Request Barang</Link></div>
        <ul className="clei-trust">{benefits.map(({ icon: Icon, short }) => <li key={short}><Icon size={17} aria-hidden="true" />{short}</li>)}</ul>
        <div className="clei-marketplaces"><p>Bisa titip dari marketplace China favoritmu</p><p>Pinduoduo <span>•</span> Taobao <span>•</span> 1688 <span>•</span> dan lainnya</p></div>
      </div></div>
    </section>

    <section className="clei-section clei-products"><div className="clei-container"><div className="clei-section-header"><div><p className="clei-eyebrow">Pilihan katalog</p><h2>Pilihan dari China, untuk kamu.</h2><p>Beberapa barang yang bisa kamu titip melalui Titip Clei.</p></div><Link className="clei-text-link" href="/products">Lihat semua produk <ArrowRight size={17} /></Link></div>
      {products.length ? <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">{products.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="clei-empty"><p>Koleksi sedang disiapkan untukmu.</p><Link href="/request" className="clei-text-link">Punya barang incaran? Kirim request <ArrowRight size={17} /></Link></div>}
    </div></section>

    <section id="cara-kerja" className="clei-section"><div className="clei-container"><p className="clei-eyebrow">Dari pilihanmu, sampai ke pintumu</p><h2>Cara titip di Titip Clei</h2><ol className="clei-steps">{steps.map(([title, text], i) => <li key={title}><span className="clei-step-number">0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol></div></section>

    <section className="clei-request"><div className="clei-container clei-banner"><div><p className="clei-eyebrow">Titipanmu, pilihanmu</p><h2>Nggak menemukan barang<br className="hidden md:block" /> yang kamu cari?</h2><p>Kirimi kami link dari Pinduoduo, Taobao, 1688, atau marketplace China lainnya.</p></div><Link href="/request" className="clei-button">Request Barang <ArrowRight size={18} /></Link></div></section>

    <section className="clei-section"><div className="clei-container"><p className="clei-eyebrow">Kenapa Titip Clei</p><h2>Titipan dengan perhatian.</h2><div className="clei-benefits">{benefits.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={28} strokeWidth={1.4} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

    <section className="clei-tracking clei-section"><div className="clei-container"><div className="clei-section-header"><div><p className="clei-eyebrow">Selalu tahu sudah sampai mana</p><h2>Setiap titipan punya perjalanan.</h2><p>Pantau perkembangan barang melalui nomor pesananmu.</p></div><Link href="/track" className="clei-button clei-button-secondary">Cek Pesanan <ArrowRight size={18} /></Link></div><ol className="clei-status-flow">{["Dipesan", "Dibeli", "Pengiriman China", "Menuju Indonesia", "Pengiriman Lokal", "Selesai"].map((status, i) => <li key={status}><span>{String(i + 1).padStart(2, "0")}</span>{status}</li>)}</ol></div></section>

    <section className="clei-section"><div className="clei-container clei-faq"><div><p className="clei-eyebrow">Sebelum mulai menitip</p><h2>Ada yang ingin<br />kamu tahu?</h2><p>Kenali prosesnya, lalu pilih barang yang kamu suka.</p></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}<details id="syarat-ketentuan"><summary>Syarat & Ketentuan pemesanan<span aria-hidden="true">+</span></summary><p>Periksa produk, varian, jumlah, dan alamat sebelum memesan. Pembelian diproses setelah pembayaran diverifikasi. Transfer sesuai nominal pada halaman pembayaran dan unggah bukti transfer. Ketersediaan barang serta pengiriman mengikuti penjual dan proses pengiriman.</p></details></div></div></section>

    <section className="clei-final"><div className="clei-container"><p className="clei-eyebrow">Dari China, untuk kamu</p><h2>Barang incaranmu,<br />selangkah lebih dekat.</h2><p>Mulai dari katalog, atau ceritakan apa yang kamu cari.</p><div className="clei-actions"><Link href="/products" className="clei-button">Lihat Produk <ArrowRight size={18} /></Link><Link href="/request" className="clei-button clei-button-secondary">Request Barang</Link></div></div></section>
  </div>;
}
