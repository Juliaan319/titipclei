import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeIndonesianPhone } from "@/lib/phone";
import { paymentTransaction, reservePayment, PaymentError } from "@/lib/payments";
import { apiError } from "@/lib/api-error";
const schema = z.object({
  productId: z.string().min(1), variantId: z.string().optional(), checkoutKey: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99), customerName: z.string().trim().min(1).max(120),
  customerPhone: z.string().max(32), customerEmail: z.string().email().max(254).or(z.literal("")),
  recipientName: z.string().trim().min(1).max(120), recipientPhone: z.string().max(32),
  addressLine: z.string().trim().min(10).max(500), province: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120), district: z.string().trim().min(2).max(120),
  postalCode: z.string().regex(/^\d{5}$/), shippingNote: z.string().max(500).optional(), termsAccepted: z.literal(true),
});
export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const phone = normalizeIndonesianPhone(input.customerPhone);
    const recipientPhone = normalizeIndonesianPhone(input.recipientPhone);
    if (!phone || !recipientPhone) throw new PaymentError("Nomor WhatsApp tidak valid.");
    const order = await paymentTransaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.checkoutKey}, 0))::text`;
      const existing = await tx.order.findUnique({ where: { checkoutKey: input.checkoutKey } });
      if (existing) return existing;
      const product = await tx.product.findFirst({ where: { id: input.productId, status: { not: "CLOSED" } }, include: { _count: { select: { variants: true } }, variants: { where: { status: "ACTIVE" }, include: { images: { orderBy: { sortOrder: "asc" } } } } } });
      if (!product || Number(product.sellingPrice) <= 0) throw new PaymentError("Produk tidak tersedia untuk dipesan.");
      const variant = product.variants.find(v => v.id === input.variantId);
      if ((product._count.variants || input.variantId) && !variant) throw new PaymentError("Pilih kombinasi varian yang tersedia.");
      const unitPrice = Number(product.sellingPrice) + Number(variant?.priceAdjustment || 0);
      const total = unitPrice * input.quantity;
      const cost = Number(product.totalCost) * input.quantity;
      const created = await tx.order.create({ data: {
        checkoutKey: input.checkoutKey, orderNumber: `TC-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`,
        productId: product.id, productNameSnapshot: product.name, variantId: variant?.id,
        variantNameSnapshot: variant?.name, selectedColor: variant?.colorName, selectedSize: variant?.size, selectedModel: variant?.model,
        selectedImageSnapshot: variant?.images[0]?.imageUrl || product.imageUrl, unitPrice, unitPriceSnapshot: unitPrice,
        quantity: input.quantity, subtotal: total, total, totalCostSnapshot: cost, profitSnapshot: total - cost,
        customerName: input.customerName, customerPhone: phone, customerEmail: input.customerEmail || null,
        recipientName: input.recipientName, recipientPhone, addressLine: input.addressLine, city: input.city,
        district: input.district, province: input.province, postalCode: input.postalCode, shippingNote: input.shippingNote,
        termsAcceptedAt: new Date(), orderTracking: { create: { status: "WAITING_PAYMENT", description: "Pesanan dibuat. Menunggu transfer pembayaran." } },
      } });
      await reservePayment(tx, created.id, total);
      return created;
    });
    return NextResponse.json({ order: { publicToken: order.publicToken, orderNumber: order.orderNumber, total: order.total } }, { status: 201 });
  } catch (error) { return apiError(error, "catalog-checkout"); }
}
