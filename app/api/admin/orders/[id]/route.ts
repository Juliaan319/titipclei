import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApi();
  if (access.response) return access.response;
  try {
    const { id } = await context.params;
    const order = await prisma.order.findUnique({ where: { id }, select: { id: true, orderNumber: true, payment: { select: { id: true } } } });
    if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      if (order.payment) await tx.paymentAttempt.deleteMany({ where: { paymentId: order.payment.id } });
      await tx.payment.deleteMany({ where: { orderId: id } });
      await tx.procurement.deleteMany({ where: { orderId: id } });
      await tx.orderTracking.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });
    revalidatePath("/admin"); revalidatePath("/admin/orders"); revalidatePath("/admin/payments"); revalidatePath("/admin/procurement"); revalidatePath("/admin/customers");
    return NextResponse.json({ success: true, orderNumber: order.orderNumber });
  } catch (error) {
    console.error("order-delete", error);
    return NextResponse.json({ error: "Pesanan tidak dapat dihapus. Coba lagi." }, { status: 400 });
  }
}
