import Link from "next/link";
const steps = [
  ["Temukan Barang", "Cari barang incaranmu dari marketplace China favoritmu."],
  ["Kirim Link / Pilih Produk", "Pilih dari katalog atau kirim link, warna, ukuran, dan jumlah yang kamu mau."],
  ["Konfirmasi & Bayar", "Periksa harga dan detail pesanan, lalu transfer dan unggah bukti pembayaran."],
  ["Kami Beli dan Kirim", "Setelah pembayaran diverifikasi, kami bantu pembelian hingga pengiriman ke Indonesia."],
];

export default function CaraKerjaPage() { return <main className="page-wrap"><p className="eyebrow">Dari pilihanmu, sampai ke pintumu</p><h1 className="page-title">Cara titip di Titip Clei</h1><ol className="mt-8 grid gap-6 sm:grid-cols-2">{steps.map(([title, text], i) => <li key={title} className="panel"><span className="text-lg font-semibold text-primary">0{i + 1}</span><h2 className="mt-3 text-lg font-semibold">{title}</h2><p className="mt-2 text-base leading-7 text-muted-foreground">{text}</p></li>)}</ol><Link href="/products" className="btn-primary mt-8">Jelajahi produk</Link></main>; }
