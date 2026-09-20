import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { prepareProductSave } from "@/lib/pricing/product-save";
import { deleteStoredProductImage } from "@/lib/storage/product-images";

function revalidateProductRoutes(slug: string) {
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath(`/products/${slug}`);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApi();
  if (access.response) return access.response;
  try {
    const { id } = await context.params;
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { exchangeRate: true, exchangeRateSource: true, exchangeRateDate: true, updatedAt: true, imageUrl: true },
    });
    if (!existing) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });

    // The calculator preview is never trusted: pricing is recalculated in prepareProductSave.
    const prepared = await prepareProductSave(await request.json(), {
      marketRate: existing.exchangeRate,
      provider: existing.exchangeRateSource,
      sourceDate: existing.exchangeRateDate,
      fetchedAt: existing.updatedAt,
    });
    const product = await prisma.$transaction(async tx => {
      const owned = new Set((await tx.productVariant.findMany({ where: { productId: id }, select: { id: true } })).map(v => v.id));
      const incoming = prepared.input.variants ?? [];
      const retained = incoming.filter(v => v.id && owned.has(v.id)).map(v => v.id!);
      await tx.productVariant.updateMany({ where: { productId: id, id: { notIn: retained } }, data: { status: "INACTIVE" } });
      for (const [index, v] of incoming.entries()) {
        const data = { name: v.name, colorName: v.colorName, colorHex: v.colorHex, size: v.size, model: v.model, status: v.status, priceAdjustment: v.priceAdjustment, sortOrder: index };
        const images = (v.images || []).map((imageUrl, sortOrder) => ({ imageUrl, sortOrder, isPrimary: sortOrder === 0 }));
        if (v.id && owned.has(v.id)) await tx.productVariant.update({ where: { id: v.id }, data: { ...data, images: { deleteMany: {}, create: images } } });
        else await tx.productVariant.create({ data: { ...data, productId: id, images: { create: images } } });
      }
      return tx.product.update({ where: { id }, data: {
        name: prepared.input.name, description: prepared.input.description || null, imageUrl: prepared.input.imageUrl || null,
        brand: prepared.input.brand || null, categoryId: prepared.input.categoryId || null, ...prepared.data,
        images: { deleteMany: {}, create: (prepared.input.imageUrls || []).map((imageUrl, sortOrder) => ({ imageUrl, sortOrder, isPrimary: sortOrder === 0 })) },
      } });
    });
    // Preserve image objects referenced by historical order snapshots.
    if (process.env.NODE_ENV === "development") {
      console.log("PRODUCT PRICING SAVE", {
        id: product.id,
        purchasePriceCny: product.originalPrice.toString(),
        exchangeRate: product.exchangeRate.toString(),
        totalCost: product.totalCost.toString(),
        marginPercentage: product.marginPercentage?.toString() ?? null,
        profit: product.profit.toString(),
        sellingPrice: product.sellingPrice.toString(),
      });
    }
    revalidateProductRoutes(product.slug);
    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Produk tidak dapat diperbarui." }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApi();
  if (access.response) return access.response;
  try {
    const { id } = await context.params;
    const product = await prisma.$transaction(async (tx) => {
      // Keep historical order snapshots while removing the catalog relation.
      await tx.order.updateMany({ where: { productId: id }, data: { productId: null, variantId: null } });
      return tx.product.delete({ where: { id }, select: { id: true, slug: true, imageUrl: true } });
    });
    await deleteStoredProductImage(product.imageUrl).catch(() => undefined);
    revalidateProductRoutes(product.slug);
    return NextResponse.json({ product, success: true });
  } catch {
    return NextResponse.json({ error: "Produk tidak dapat dihapus." }, { status: 400 });
  }
}
