export type VariantOption = { colorName: string | null; size: string | null; model: string | null };
export function variantsForColor<T extends VariantOption>(variants: T[], color: string | null) {
  const hasColors = variants.some(v => v.colorName);
  return variants.filter(v => !hasColors || v.colorName === color);
}
export function sizesForColor(variants: VariantOption[], color: string | null) {
  return [...new Set(variantsForColor(variants, color).map(v => v.size).filter((s): s is string => Boolean(s)))];
}
