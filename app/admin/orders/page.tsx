import { OrderStatus } from "@prisma/client";
import { ListFilters, ListPagination, type ListParams } from "@/components/ListFilters";
import { listQuery } from "@/lib/list-query";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/require-admin";
import { orderStatusMap } from "@/lib/order-status";
import { AdminOrderDeleteButton } from "@/components/AdminOrderDeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<ListParams> }) {
  await requireAdminPage();
  
  const params = await searchParams;
  const { createdAt, ...query } = listQuery(params);
  const status = Object.values(OrderStatus).find(s => s === params.status);
  const orders = await prisma.order.findMany({ ...query, where: { createdAt, orderStatus: status, ...(params.q ? { OR: [{orderNumber:{contains:params.q,mode:"insensitive"}},{customerName:{contains:params.q,mode:"insensitive"}},{productNameSnapshot:{contains:params.q,mode:"insensitive"}}] } : {}) } });

  return (
    <div className="mx-auto max-w-7xl py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Kelola Pesanan</h1>
      </div>

      <div className="my-6"><ListFilters params={params} base="/admin/orders" statuses={Object.fromEntries(Object.entries(orderStatusMap).map(([k,v])=>[k,v.label]))}/></div><div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-semibold">Order ID / Tanggal</th>
              <th className="px-6 py-4 font-semibold">Pelanggan</th>
              <th className="px-6 py-4 font-semibold">Produk</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.slice(0,30).map((order) => {
              const statusInfo = orderStatusMap[order.orderStatus];
              return (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {new Date(order.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-slate-500 text-xs mt-1">{order.customerPhone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium truncate max-w-xs" title={order.productNameSnapshot || undefined}>{order.productNameSnapshot}</p>
                    <p className="text-slate-500 text-xs mt-1">{order.quantity} pcs</p>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    Rp {Number(order.total).toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${statusInfo?.color.bg || "bg-secondary"} ${statusInfo?.color.text || "text-foreground"}`}>
                      {statusInfo?.label || order.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      href={`/admin/orders/${order.id}`}
                      className="text-rose-600 font-semibold hover:underline"
                    >
                      Detail
                    </Link>
                    <AdminOrderDeleteButton orderId={order.id} />
                  </td>
                </tr>
              );
            })}
            
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  Belum ada pesanan
                </td>
              </tr>
            )}
          </tbody>
        </table><ListPagination params={params} hasNext={orders.length>30}/>
      </div>
    </div>
  );
}
