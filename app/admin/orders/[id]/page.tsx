import { ProcurementForm } from "@/components/ProcurementForm";
import { orderFinance } from "@/lib/finance";
import { formatIdr } from "@/lib/money";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/require-admin";
import { AdminOrderStatusUpdater } from "@/components/AdminOrderStatusUpdater";
import { AdminOrderDeleteButton } from "@/components/AdminOrderDeleteButton";
import { AdminPaymentDeleteButton } from "@/components/AdminPaymentDeleteButton";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      product: true,
      payment: true,
      procurement: true, quotation: true,
      orderTracking: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!order) notFound();
  const finance = orderFinance(order);
  const procurement = order.procurement;
  const initial = procurement ? { ...procurement, purchasePrice: Number(procurement.purchasePrice), exchangeRate: Number(procurement.exchangeRate), chinaShipping: Number(procurement.chinaShipping), internationalShipping: Number(procurement.internationalShipping), tax: Number(procurement.tax), additionalCost: Number(procurement.additionalCost), purchasedAt: procurement.purchasedAt?.toISOString().slice(0,10) || "" } : undefined;

  return (
    <div className="mx-auto max-w-4xl py-8">
      <Link href="/admin/payments" className="text-sm font-semibold text-rose-600 mb-6 inline-block">
        ← Kembali
      </Link>
      
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Detail Pesanan: {order.orderNumber}</h1>
          <p className="text-sm text-slate-500 mt-1">Status saat ini: {order.orderStatus}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3"><AdminOrderDeleteButton orderId={order.id} />{order.payment && <AdminPaymentDeleteButton paymentId={order.payment.id} />}</div>

      <section className="panel mt-6"><h2 className="font-semibold">Pembayaran & ringkasan keuangan</h2><dl className="mt-4 grid gap-4 sm:grid-cols-3">{[["Pendapatan",finance.revenue],[finance.actual?"Biaya aktual":"Estimasi biaya",finance.cost],[finance.actual?"Laba kotor":"Estimasi laba",finance.profit],["Kode unik (bukan pendapatan)",order.payment?.uniqueCode||0],["Nominal transfer",order.payment?.transferAmount||0]].map(([label,value])=><div key={String(label)}><dt className="text-sm text-muted-foreground">{String(label)}</dt><dd className="mt-1 font-semibold">{formatIdr(value)}</dd></div>)}</dl>{(order.payment?.proofImageUrl||order.payment?.proofStorageKey)&&<a href={`/api/admin/payments/${order.payment!.id}/proof`} target="_blank" rel="noreferrer" className="mt-4 inline-block text-primary underline">Lihat bukti pembayaran</a>}</section>
      {["VERIFIED","PAID"].includes(order.paymentStatus)&&!["CANCELLED","COMPLETED"].includes(order.orderStatus)&&<section id="procurement" className="mt-6"><ProcurementForm orderId={order.id} quantity={order.quantity} initial={initial}/></section>}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Informasi Customer</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Nama</dt>
              <dd className="font-semibold">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">WhatsApp</dt>
              <dd className="font-semibold">{order.customerPhone}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-semibold">{order.customerEmail || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Produk yang Dipesan</h2>
          <div className="flex gap-4">
            {order.selectedImageSnapshot ? (
              <img src={order.selectedImageSnapshot} alt="" className="h-20 w-20 rounded-lg object-cover" />
            ) : order.product?.imageUrl ? (
              <img src={order.product.imageUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-slate-100" />
            )}
            <div className="text-sm">
              <p className="font-bold">{order.productNameSnapshot}</p>
              <p className="text-slate-500 mt-1">Qty: {order.quantity}</p>
              
              {(order.selectedColor || order.selectedSize || order.selectedModel) && (
                <div className="mt-2 inline-block rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                  Varian: {[order.selectedColor, order.selectedSize, order.selectedModel].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#E8D8D1] bg-[#FFFDFC] p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#4B342F]">Alamat Pengiriman</h2>
          {order.addressLine ? (
            <dl className="space-y-3 text-sm text-[#4B342F]">
              <div><dt className="text-[#8A6F67]">Penerima</dt><dd className="font-semibold">{order.recipientName || order.customerName}</dd></div>
              <div><dt className="text-[#8A6F67]">WhatsApp</dt><dd className="font-semibold">{order.recipientPhone || order.customerPhone}</dd></div>
              <div><dt className="text-[#8A6F67]">Alamat</dt><dd className="font-semibold leading-6">{order.addressLine}<br />{order.city}, {order.province} {order.postalCode}</dd></div>
              {order.shippingNote && <div><dt className="text-[#8A6F67]">Catatan</dt><dd>{order.shippingNote}</dd></div>}
            </dl>
          ) : <p className="text-sm text-[#8A6F67]">Alamat pengiriman belum dilengkapi customer.</p>}
        </section>

        <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Update Status & Pengiriman</h2>
          <AdminOrderStatusUpdater 
            orderId={order.id} 
            currentStatus={order.orderStatus} 
            trackingHistory={order.orderTracking}
          />
        </section>
      </div>
    </div>
  );
}
