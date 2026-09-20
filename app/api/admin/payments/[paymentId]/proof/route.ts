import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { getProductImagesAdmin, PAYMENT_PROOFS_BUCKET } from "@/lib/storage/product-images";

export async function GET(_: Request, context: { params: Promise<{ paymentId: string }> }) {
  const access = await requireAdminApi();
  if (access.response) return access.response;
  const { paymentId } = await context.params;
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, select: { proofStorageKey: true, proofImageUrl: true } });
  if (!payment) return NextResponse.json({ error: "Pembayaran tidak ditemukan." }, { status: 404 });
  if (payment.proofStorageKey) {
    const { data, error } = await getProductImagesAdmin().storage.from(PAYMENT_PROOFS_BUCKET).createSignedUrl(payment.proofStorageKey, 60);
    if (error || !data?.signedUrl) return NextResponse.json({ error: "Bukti transfer tidak dapat diakses." }, { status: 502 });
    return NextResponse.redirect(data.signedUrl);
  }
  if (payment.proofImageUrl?.startsWith("data:image/")) {
    const match = payment.proofImageUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if (match) return new Response(Buffer.from(match[2], "base64"), { headers: { "Content-Type": match[1], "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  }
  if (payment.proofImageUrl?.startsWith("http")) return NextResponse.redirect(payment.proofImageUrl);
  return NextResponse.json({ error: "Bukti transfer belum tersedia." }, { status: 404 });
}
