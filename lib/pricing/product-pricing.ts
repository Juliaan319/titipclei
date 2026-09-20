import { MarginType, Prisma } from "@prisma/client";

type PriceRoundingType = "NONE" | "ROUND_1000" | "ROUND_5000" | "ROUND_10000";

export type ProductPricingInput = {
  purchasePriceCny: string | number | Prisma.Decimal;
  exchangeRate: string | number | Prisma.Decimal;
  chinaShipping?: string | number | Prisma.Decimal;
  internationalShipping?: string | number | Prisma.Decimal;
  tax?: string | number | Prisma.Decimal;
  additionalCost?: string | number | Prisma.Decimal;
  marginType: MarginType;
  marginPercentage?: string | number | Prisma.Decimal | null;
  marginFixed?: string | number | Prisma.Decimal | null;
  roundingType: PriceRoundingType;
};

const decimal = (value: string | number | Prisma.Decimal | null | undefined) => new Prisma.Decimal(value ?? 0);

export function calculateProductPricing(input: ProductPricingInput) {
  const purchasePriceIdr = decimal(input.purchasePriceCny).mul(decimal(input.exchangeRate));
  const totalCost = purchasePriceIdr.plus(decimal(input.chinaShipping)).plus(decimal(input.internationalShipping)).plus(decimal(input.tax)).plus(decimal(input.additionalCost));
  const percentageProfit = totalCost.mul(decimal(input.marginPercentage)).div(100);
  const fixedProfit = decimal(input.marginFixed);
  const profit = input.marginType === MarginType.PERCENTAGE ? percentageProfit : input.marginType === MarginType.FIXED ? fixedProfit : percentageProfit.plus(fixedProfit);
  const calculatedSellingPrice = totalCost.plus(profit);
  const finalSellingPrice = roundSellingPrice(calculatedSellingPrice, input.roundingType);

  return { purchasePriceIdr, totalCost, profit: finalSellingPrice.minus(totalCost), calculatedSellingPrice, finalSellingPrice };
}

function roundSellingPrice(price: Prisma.Decimal, roundingType: PriceRoundingType) {
  const increment = roundingType === "ROUND_1000" ? 1000 : roundingType === "ROUND_5000" ? 5000 : roundingType === "ROUND_10000" ? 10000 : 0;
  return increment ? price.div(increment).ceil().mul(increment) : price.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
}
