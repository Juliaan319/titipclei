import { NextResponse } from "next/server";
import { reservePayment, paymentTransaction, PaymentError } from "@/lib/payments";
import { apiError } from "@/lib/api-error";
export async function POST(_: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId: token } = await context.params;
    const payment = await paymentTransaction(async tx => {
      const order = await tx.order.findUnique({ where: { publicToken: token } });
      if (!order || order.orderStatus !== "WAITING_PAYMENT") throw new PaymentError("Pesanan tidak dapat dibayar saat ini.");
      const payment = await reservePayment(tx, order.id, order.total);
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: payment.status } });
      return payment;
    });
    return NextResponse.json({ transferAmount: Number(payment.transferAmount) });
  } catch (error) { return apiError(error, "reserve-payment"); }
}
