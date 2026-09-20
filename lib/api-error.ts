import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PaymentError } from "@/lib/payments";
export function apiError(error: unknown, operation: string) {
  if (error instanceof ZodError) return NextResponse.json({ error: "Periksa kembali isian formulir.", fields: error.flatten().fieldErrors }, { status: 400 });
  if (error instanceof PaymentError) return NextResponse.json({ error: error.message }, { status: 409 });
  console.error(operation, { name: error instanceof Error ? error.name : "UnknownError" });
  return NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 });
}
