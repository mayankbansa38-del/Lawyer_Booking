/*
  Warnings:

  - A unique constraint covering the columns `[lawyer_id,scheduled_date,scheduled_time]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CasePaymentStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'DENIED', 'COMPLETED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CaseStatus" ADD VALUE 'REQUESTED';
ALTER TYPE "CaseStatus" ADD VALUE 'REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_REQUEST_RECEIVED';

-- AlterTable
ALTER TABLE "lawyers" ADD COLUMN     "bank_account_name" TEXT,
ADD COLUMN     "bank_account_number" TEXT,
ADD COLUMN     "bank_ifsc_code" TEXT,
ADD COLUMN     "upi_id" TEXT;

-- CreateTable
CREATE TABLE "blocked_periods" (
    "id" TEXT NOT NULL,
    "lawyer_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_payments" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "amount_in_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "CasePaymentStatus" NOT NULL DEFAULT 'REQUESTED',
    "description" TEXT NOT NULL,
    "requested_by_lawyer_id" TEXT NOT NULL,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blocked_periods_lawyer_id_start_date_idx" ON "blocked_periods"("lawyer_id", "start_date");

-- CreateIndex
CREATE UNIQUE INDEX "case_payments_razorpay_order_id_key" ON "case_payments"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "case_payments_razorpay_payment_id_key" ON "case_payments"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "case_payments_case_id_idx" ON "case_payments"("case_id");

-- CreateIndex
CREATE INDEX "case_payments_status_idx" ON "case_payments"("status");

-- CreateIndex
CREATE INDEX "case_payments_razorpay_order_id_idx" ON "case_payments"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_lawyer_slot" ON "bookings"("lawyer_id", "scheduled_date", "scheduled_time");

-- AddForeignKey
ALTER TABLE "blocked_periods" ADD CONSTRAINT "blocked_periods_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "lawyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_payments" ADD CONSTRAINT "case_payments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
