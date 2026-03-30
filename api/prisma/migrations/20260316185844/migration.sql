/*
  Warnings:

  - You are about to drop the column `gradientClass` on the `ClubCard` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[barcodeSerial]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ClubCard" DROP COLUMN "gradientClass",
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "barcodeSerial" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "minStockLevel" INTEGER NOT NULL DEFAULT 5;

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcodeSerial_key" ON "Product"("barcodeSerial");
