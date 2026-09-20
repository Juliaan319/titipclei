import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApi(); if (access.response) return access.response;
  const { id } = await context.params; const { status } = await request.json();
  if (!['PENDING_REVIEW', 'REVIEWED', 'QUOTATION_SENT', 'ACCEPTED', 'QUOTATION_REJECTED', 'CANCELLED'].includes(status)) return NextResponse.json({ error: 'Status request tidak valid.' }, { status: 400 });
  const updated = await prisma.jastipRequest.update({ where: { id }, data: { status } });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApi();
  if (access.response) return access.response;

  const { id } = await context.params;
  if (!id || id.length > 128) return NextResponse.json({ error: "ID request tidak valid." }, { status: 400 });

  const request = await prisma.jastipRequest.findUnique({
    where: { id },
    select: { id: true, quotations: { select: { id: true, orders: { select: { id: true } } } } },
  });
  if (!request) return NextResponse.json({ error: "Request tidak ditemukan." }, { status: 404 });

  const linkedOrder = await prisma.order.findFirst({ where: { requestId: id }, select: { id: true } });
  if (linkedOrder || request.quotations.some((quotation) => quotation.orders.length > 0)) {
    return NextResponse.json({ error: "Request ini sudah terhubung dengan pesanan dan tidak dapat dihapus." }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.quotation.deleteMany({ where: { jastipRequestId: id } });
    await tx.jastipRequest.delete({ where: { id } });
  });
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  return NextResponse.json({ success: true });
}
