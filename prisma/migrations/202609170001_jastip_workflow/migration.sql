-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('PLANNED', 'PURCHASED', 'WAITING_SHIPMENT');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "JastipRequest" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "marketplace" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "checkoutKey" TEXT,
ADD COLUMN     "district" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "baseAmount" DECIMAL(18,0) NOT NULL DEFAULT 0,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "transferAmount" DECIMAL(18,0) NOT NULL DEFAULT 0,
ADD COLUMN     "uniqueCode" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "baseAmount" DECIMAL(18,0) NOT NULL,
    "uniqueCode" INTEGER NOT NULL,
    "transferAmount" DECIMAL(18,0) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "proofImageUrl" TEXT,
    "proofStorageKey" TEXT,
    "submittedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procurement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "seller" TEXT,
    "productUrl" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "purchasePrice" DECIMAL(18,2) NOT NULL,
    "exchangeRate" DECIMAL(18,4) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "variant" TEXT,
    "chinaShipping" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "internationalShipping" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "tax" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "additionalCost" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(18,0) NOT NULL,
    "purchasedAt" TIMESTAMP(3),
    "status" "ProcurementStatus" NOT NULL DEFAULT 'PLANNED',
    "externalOrderNumber" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Procurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Procurement_orderId_key" ON "Procurement"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_checkoutKey_key" ON "Order"("checkoutKey");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procurement" ADD CONSTRAINT "Procurement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve legacy transfers exactly. Code zero is reserved for pre-migration records.
UPDATE "Payment" SET "baseAmount"=ROUND("amount"::numeric), "transferAmount"=ROUND("amount"::numeric);
UPDATE "JastipRequest" r SET "customerName"=u."name", "customerPhone"=u."phone", "customerEmail"=u."email" FROM "User" u WHERE r."userId"=u."id";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_code_range" CHECK ("uniqueCode" BETWEEN 0 AND 100);
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transfer_sum" CHECK ("transferAmount" = "baseAmount" + "uniqueCode");
CREATE UNIQUE INDEX "Payment_active_base_code_key" ON "Payment"("baseAmount", "uniqueCode") WHERE "status" IN ('WAITING_PAYMENT','WAITING_VERIFICATION') AND "uniqueCode" > 0;
