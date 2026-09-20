import type { Prisma } from "@prisma/client";
export function orderFinance(order: { total: number; totalCostSnapshot: Prisma.Decimal | null; procurement?: { totalCost: Prisma.Decimal; status: string } | null; quotation?: { totalCost: number } | null }) {
 const actual = !!order.procurement && order.procurement.status !== "PLANNED";
 const cost = Number(actual ? order.procurement!.totalCost : order.totalCostSnapshot ?? order.quotation?.totalCost ?? 0);
 return { revenue: order.total, cost, profit: order.total-cost, actual };
}
