import { MarginType } from "@prisma/client";

export interface PricingInput {
  originalPrice: number;
  quantity: number;
  appliedExchangeRate: number;
  internationalShipping?: number;
  tax?: number;
  additionalCost?: number;
  marginType: MarginType;
  marginValue: number;
  marginFixed?: number;
}

export interface PricingResult {
  convertedProductCost: number;
  totalCost: number;
  serviceFee: number;
  profit: number;
  finalPrice: number;
}

export function calculatePricing(input: PricingInput): PricingResult {
  const {
    originalPrice,
    quantity,
    appliedExchangeRate,
    internationalShipping = 0,
    tax = 0,
    additionalCost = 0,
    marginType,
    marginValue
  } = input;

  const convertedProductCost = originalPrice * quantity * appliedExchangeRate;
  const totalCost = convertedProductCost + internationalShipping + tax + additionalCost;

  let serviceFee = 0;
  if (marginType === 'PERCENTAGE') {
    serviceFee = totalCost * (marginValue / 100);
  } else if (marginType === 'FIXED') {
    serviceFee = marginValue;
  } else if (marginType === 'PERCENTAGE_PLUS_FIXED') {
    // Assuming marginValue represents percentage, we'd need fixed amount too.
    // For MVP, simplify or extend input if needed.
    // Let's assume marginValue is percentage and fixed amount is some standard or pass it.
    serviceFee = (totalCost * (marginValue / 100)) + (input.marginFixed ?? 0);
  }

  const profit = serviceFee;
  const finalPrice = totalCost + serviceFee;

  return {
    convertedProductCost,
    totalCost,
    serviceFee,
    profit,
    finalPrice
  };
}

export enum RoundingSetting {
  NONE = 'NONE',
  ROUND_1000 = 'ROUND_1000',
  ROUND_5000 = 'ROUND_5000',
  ROUND_10000 = 'ROUND_10000',
  PSYCHOLOGICAL = 'PSYCHOLOGICAL'
}

export function roundPrice(price: number, setting: RoundingSetting): number {
  switch (setting) {
    case RoundingSetting.ROUND_1000:
      return Math.ceil(price / 1000) * 1000;
    case RoundingSetting.ROUND_5000:
      return Math.ceil(price / 5000) * 5000;
    case RoundingSetting.ROUND_10000:
      return Math.ceil(price / 10000) * 10000;
    case RoundingSetting.PSYCHOLOGICAL:
      const rounded1000 = Math.ceil(price / 1000) * 1000;
      return rounded1000 - 1000 + 900; // e.g. 1553000 -> 1552900
    case RoundingSetting.NONE:
    default:
      return price;
  }
}

export function formatCurrency(amount: number, currencyCode: string = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
