import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApi(); if (access.response) return access.response;
  try { const { id } = await context.params; const source = await prisma.product.findUnique({ where: { id }, include: { images: true, variants: { include: { images: true } } } }); if (!source) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 }); const name = `${source.name} - Copy`; const product = await prisma.product.create({ data: { ...source, images: { create: source.images.map(({imageUrl,sortOrder,isPrimary})=>({imageUrl,sortOrder,isPrimary})) }, variants: { create: source.variants.map(({name,colorName,colorHex,size,model,sku,status,priceAdjustment,sortOrder,images})=>({name,colorName,colorHex,size,model,sku,status,priceAdjustment,sortOrder,images:{create:images.map(({imageUrl,sortOrder,isPrimary})=>({imageUrl,sortOrder,isPrimary}))}})) }, id: undefined, slug: `${slugify(name)}-${crypto.randomUUID().slice(0, 6)}`, name, createdAt: undefined, updatedAt: undefined } }); revalidatePath("/products"); revalidatePath("/"); revalidatePath("/admin/products"); return NextResponse.json({ id: product.id }); } catch { return NextResponse.json({ error: "Produk gagal diduplikat." }, { status: 400 }); }
}
