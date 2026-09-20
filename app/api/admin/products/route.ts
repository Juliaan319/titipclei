import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { prepareProductSave } from "@/lib/pricing/product-save";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function POST(request: Request) {
  const access = await requireAdminApi();
  if (access.response) return access.response;
  try {
    const prepared = await prepareProductSave(await request.json());
    const base = slugify(prepared.input.name) || "produk";
    const product = await prisma.product.create({
      data: {
        name: prepared.input.name,
        slug: `${base}-${crypto.randomUUID().slice(0, 6)}`,
        description: prepared.input.description || null,
        imageUrl: prepared.input.imageUrl || null,
        brand: prepared.input.brand || null,
        categoryId: prepared.input.categoryId || null,
        countryCode: "CN",
        currencyCode: "CNY",
        ...prepared.data,
        images: { create: (prepared.input.imageUrls || (prepared.input.imageUrl ? [prepared.input.imageUrl] : [])).map((imageUrl: string, idx: number) => ({ imageUrl, sortOrder: idx, isPrimary: idx === 0 })) },
        variants: {
          create: prepared.input.variants?.map((v) => ({
            name: v.name,
            status: v.status,
            colorName: v.colorName,
            colorHex: v.colorHex,
            size: v.size,
            model: v.model,
            stock: Number(v.stock) || 0,
            priceAdjustment: Number(v.priceAdjustment) || 0,
            images: {
              create: v.images?.map((url: string, idx: number) => ({
                imageUrl: url,
                sortOrder: idx,
                isPrimary: idx === 0
              })) || []
            }
          })) || []
        }
      },
    });
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath(`/products/${product.slug}`);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Data harga produk tidak valid." }, { status: 400 });
  }
}
