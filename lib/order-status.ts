import type { LucideIcon } from "lucide-react";
import {
  Clock,
  FileCheck,
  CircleCheck,
  ShoppingBag,
  PackageCheck,
  Truck,
  CheckCircle2,
  CircleX,
  Wallet,
  AlertCircle,
  Home
} from "lucide-react";

export type OrderStatusEnum = 
  | "WAITING_PAYMENT"
  | "WAITING_VERIFICATION"
  | "PAID"
  | "PURCHASING"
  | "PURCHASED"
  | "CHECKING_ITEM"
  | "INTERNATIONAL_SHIPPING"
  | "ARRIVED_INDONESIA"
  | "DOMESTIC_SHIPPING"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatusEnum =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED"
  | "WAITING_PAYMENT"
  | "WAITING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

export const orderStatusMap: Record<string, {
  label: string;
  headline: string;
  description: string;
  nextStep?: string;
  color: { bg: string; text: string };
  icon: LucideIcon;
  stepIndex: number;
}> = {
  WAITING_PAYMENT: {
    label: "Menunggu Pembayaran",
    headline: "Menunggu Pembayaran",
    description: "Silakan lakukan transfer sesuai nominal yang tertera dan unggah bukti pembayaran.",
    nextStep: "Upload Bukti Pembayaran",
    color: { bg: "bg-amber-100", text: "text-amber-800" },
    icon: Wallet,
    stepIndex: 1,
  },
  WAITING_VERIFICATION: {
    label: "Menunggu Verifikasi Pembayaran",
    headline: "Bukti Pembayaran Sedang Diverifikasi",
    description: "Bukti transfermu sudah kami terima dan sedang diperiksa.",
    nextStep: "Kamu tidak perlu melakukan apa pun untuk sekarang. Kami akan memperbarui status setelah pembayaran diverifikasi.",
    color: { bg: "bg-orange-100", text: "text-orange-800" },
    icon: FileCheck,
    stepIndex: 2,
  },
  PAID: {
    label: "Pembayaran Terverifikasi",
    headline: "Pembayaran Berhasil Diverifikasi",
    description: "Pembayaranmu sudah kami konfirmasi. Pesanan akan segera diproses untuk pembelian.",
    color: { bg: "bg-green-100", text: "text-green-800" },
    icon: CircleCheck,
    stepIndex: 3,
  },
  PAYMENT_VERIFIED: {
    label: "Pembayaran Terverifikasi",
    headline: "Pembayaran Berhasil Diverifikasi",
    description: "Pembayaranmu sudah kami konfirmasi. Pesanan akan segera diproses untuk pembelian.",
    color: { bg: "bg-green-100", text: "text-green-800" },
    icon: CircleCheck,
    stepIndex: 3,
  },
  VERIFIED: {
    label: "Pembayaran Terverifikasi",
    headline: "Pembayaran Berhasil Diverifikasi",
    description: "Pembayaranmu sudah kami konfirmasi. Pesanan akan segera diproses untuk pembelian.",
    color: { bg: "bg-green-100", text: "text-green-800" },
    icon: CircleCheck,
    stepIndex: 3,
  },
  PURCHASING: {
    label: "Barang Sedang Dipesan",
    headline: "Barang Sedang Dipesan",
    description: "Pembayaranmu sudah berhasil diverifikasi. Pesanan sedang kami proses untuk pembelian.",
    color: { bg: "bg-[#FBECEF]", text: "text-[#7A3340]" },
    icon: ShoppingBag,
    stepIndex: 3,
  },
  PURCHASED: {
    label: "Barang Sudah Dibeli",
    headline: "Barang Sudah Dibeli",
    description: "Barangmu sudah berhasil dibeli dan menunggu proses berikutnya.",
    color: { bg: "bg-[#F7E8D9]", text: "text-[#704433]" },
    icon: ShoppingBag,
    stepIndex: 4,
  },
  CHECKING_ITEM: {
    label: "Menunggu Pengiriman",
    headline: "Menunggu Pengiriman",
    description: "Barang sedang menunggu proses pengiriman.",
    color: { bg: "bg-[#F7E8D9]", text: "text-[#704433]" },
    icon: PackageCheck,
    stepIndex: 5,
  },
  INTERNATIONAL_SHIPPING: {
    label: "Dalam Pengiriman ke Indonesia",
    headline: "Dalam Pengiriman ke Indonesia",
    description: "Barangmu sedang dalam perjalanan menuju Indonesia.",
    color: { bg: "bg-[#F7E8D9]", text: "text-[#704433]" },
    icon: Truck,
    stepIndex: 6,
  },
  ARRIVED_INDONESIA: {
    label: "Barang Tiba di Indonesia",
    headline: "Barang Sudah Tiba di Indonesia",
    description: "Barang sudah sampai di Indonesia dan sedang disiapkan untuk pengiriman lokal.",
    color: { bg: "bg-[#F7E8D9]", text: "text-[#704433]" },
    icon: PackageCheck,
    stepIndex: 6,
  },
  DOMESTIC_SHIPPING: {
    label: "Dalam Pengiriman ke Alamat",
    headline: "Dalam Pengiriman ke Alamat",
    description: "Barang sedang dikirim ke alamat tujuan.",
    color: { bg: "bg-[#F7E8D9]", text: "text-[#704433]" },
    icon: Home,
    stepIndex: 7,
  },
  COMPLETED: {
    label: "Selesai",
    headline: "Pesanan Selesai",
    description: "Pesanan telah selesai. Terima kasih sudah menggunakan Titip Clei.",
    color: { bg: "bg-green-100", text: "text-green-800" },
    icon: CheckCircle2,
    stepIndex: 8,
  },
  CANCELLED: {
    label: "Dibatalkan",
    headline: "Pesanan Dibatalkan",
    description: "Pesanan ini telah dibatalkan.",
    color: { bg: "bg-red-100", text: "text-red-800" },
    icon: CircleX,
    stepIndex: -1,
  },
  REJECTED: {
    label: "Bukti Pembayaran Ditolak",
    headline: "Bukti Pembayaran Perlu Dikirim Ulang",
    description: "Bukti pembayaran sebelumnya belum dapat diverifikasi.",
    nextStep: "Upload Bukti Baru",
    color: { bg: "bg-red-100", text: "text-red-800" },
    icon: AlertCircle,
    stepIndex: -1,
  },
};

export const paymentStatusMap: Record<string, { label: string; color: { bg: string; text: string } }> = {
  PENDING: { label: "Menunggu Pembayaran", color: { bg: "bg-amber-100", text: "text-amber-800" } },
  WAITING_PAYMENT: { label: "Menunggu Pembayaran", color: { bg: "bg-amber-100", text: "text-amber-800" } },
  WAITING_VERIFICATION: { label: "Menunggu Verifikasi", color: { bg: "bg-orange-100", text: "text-orange-800" } },
  VERIFIED: { label: "Terverifikasi", color: { bg: "bg-green-100", text: "text-green-800" } },
  PAID: { label: "Sudah Dibayar", color: { bg: "bg-green-100", text: "text-green-800" } },
  REJECTED: { label: "Ditolak", color: { bg: "bg-red-100", text: "text-red-800" } },
  FAILED: { label: "Gagal", color: { bg: "bg-red-100", text: "text-red-800" } },
  EXPIRED: { label: "Kedaluwarsa", color: { bg: "bg-red-100", text: "text-red-800" } },
  REFUNDED: { label: "Dikembalikan", color: { bg: "bg-gray-100", text: "text-gray-800" } },
};

export const progressSteps = ["Penawaran", "Pembayaran", "Verifikasi", "Dipesan", "Dibeli", "Menunggu Kirim", "Ke Indonesia", "Ke Alamat", "Selesai"];

export function getOrderStatus(status: string) {
  return orderStatusMap[status] || {
    label: status,
    headline: status,
    description: "",
    color: { bg: "bg-slate-100", text: "text-slate-800" },
    icon: Clock,
    stepIndex: -1,
  };
}

export function getPaymentStatus(status: string) {
  return paymentStatusMap[status] || {
    label: status,
    color: { bg: "bg-slate-100", text: "text-slate-800" },
  };
}
