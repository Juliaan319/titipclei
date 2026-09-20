import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CatalogOrderForm } from "@/components/CatalogOrderForm";
import { paymentDestination } from "@/lib/payment-settings";

export const dynamic = "force-dynamic";

export default async function CatalogOrderPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const { slug } = await params;
  const { variant: variantId } = await searchParams;
  
  const product = await prisma.product.findFirst({ 
    where: { slug, status: { not: "CLOSED" } }, 
    include: { category: true, variants: { where: { status: "ACTIVE" }, select: { id: true } } } 
  });
  if (!product) notFound();

  let selectedVariant = null;
  if (variantId) {
    const v = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } }
    });
    if (v && v.productId === product.id && v.status === "ACTIVE") {
      selectedVariant = {
        id: v.id,
        name: v.name,
        colorName: v.colorName,
        size: v.size,
        model: v.model,
        priceAdjustment: Number(v.priceAdjustment),
        imageUrl: v.images.length > 0 ? v.images[0].imageUrl : null,
      };
    }
  }

  if (product.variants.length && !selectedVariant) redirect(`/products/${product.slug}`);
  return (
    <CatalogOrderForm 
      product={{ 
        id: product.id, 
        slug: product.slug, 
        name: product.name, 
        brand: product.brand, 
        category: product.category?.name ?? "Produk", 
        imageUrl: product.imageUrl, 
        sellingPrice: Number(product.sellingPrice), 
        status: product.status 
      }} 
      paymentDestination={paymentDestination} 
      selectedVariant={selectedVariant}
    />
  );
}
