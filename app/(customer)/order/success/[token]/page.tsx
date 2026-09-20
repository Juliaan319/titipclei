import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusCard } from "@/components/order-status/OrderStatusCard";
import { ProgressTimeline } from "@/components/order-status/ProgressTimeline";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await prisma.order.findUnique({ where: { publicToken: token }, include: { payment: true, orderTracking: { orderBy: { createdAt: "desc" } } } });
  if (!order) notFound();

  return (
    <main className="min-h-screen bg-[#FFF9F5] py-12">
      <div className="mx-auto max-w-[1200px] space-y-6 px-4">
        <section className="rounded-xl border border-[#E8D8D1] bg-[#FFFDFC] p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wider text-[#B95F70]">Pesanan Diterima</p>
          <h1 className="mt-3 text-3xl font-extrabold text-[#4B342F]">{order.orderStatus === "WAITING_VERIFICATION" ? "Bukti transfermu sudah kami terima." : "Pantau perjalanan titipanmu."}</h1>
          <p className="mt-4 text-[#725A53]">Status pesanan diperbarui mulai dari pembayaran sampai pengiriman.</p>
          <div className="mt-6 rounded-xl bg-[#FBECEF] p-5"><p className="text-sm text-[#725A53]">Kode Pesanan</p><p className="mt-1 text-2xl font-extrabold text-[#7A3340]">{order.orderNumber}</p><p className="mt-4 text-sm text-[#725A53]">{order.productNameSnapshot} · Rp {Math.round(Number(order.total) || 0).toLocaleString("id-ID")}</p></div>
        </section>

        {order.addressLine && <section className="rounded-xl border border-[#E8D8D1] bg-[#FFFDFC] p-6 shadow-sm"><h2 className="font-bold text-[#4B342F]">Alamat Pengiriman</h2><p className="mt-3 font-semibold text-[#4B342F]">{order.recipientName || order.customerName}</p><p className="mt-1 text-sm leading-6 text-[#725A53]">{order.addressLine}<br />{order.city}, {order.province} {order.postalCode}</p><p className="mt-4 text-sm text-[#8A6F67]">Pastikan alamat sudah benar sebelum pesanan memasuki tahap pengiriman.</p></section>}

        <OrderStatusCard status={order.orderStatus} paymentStatus={order.paymentStatus} paymentProofSent={Boolean(order.payment?.proofImageUrl || order.payment?.proofStorageKey)} orderNumber={order.publicToken} />
        <section className="rounded-xl border border-[#E8D8D1] bg-[#FFFDFC] p-6 shadow-sm"><h2 className="font-bold text-[#4B342F]">Proses Pesanan</h2><ProgressTimeline currentStatus={order.orderStatus} /></section>
        <section className="panel"><h2 className="font-semibold">Riwayat pesanan</h2><ol className="mt-4 space-y-4">{order.orderTracking.map(event=><li key={event.id} className="border-l-2 pl-4"><time className="text-sm text-muted-foreground">{event.createdAt.toLocaleString("id-ID",{timeZone:"Asia/Jakarta"})}</time><p className="mt-1 text-sm">{event.description}</p>{event.trackingNumber&&<p className="mt-1 text-sm font-semibold">{event.courier} &bull; {event.trackingNumber}</p>}</li>)}</ol></section>
        <Link href="/track" className="inline-flex rounded-xl bg-[#B74F68] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#A8435B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB5C0] focus-visible:ring-offset-2">Cek Status Pesanan</Link>
      </div>
    </main>
  );
}
