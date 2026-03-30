CREATE TYPE "OrderStatus" AS ENUM ('pending', 'pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE "PaymentGateway" AS ENUM ('cash', 'card', 'mpesa');
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'success', 'failed', 'refunded');

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "customerId" TEXT,
  "subtotal" DOUBLE PRECISION NOT NULL,
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'confirmed',
  "paymentMethod" "PaymentGateway" NOT NULL,
  "deliveryAddress" JSONB,
  "billingAddress" JSONB,
  "deliveryNotes" TEXT,
  "notes" TEXT,
  "cashierId" TEXT,
  "cashierName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variationId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "variationName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Transaction" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "gatewayTransactionId" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MZN',
  "gateway" "PaymentGateway" NOT NULL,
  "status" "TransactionStatus" NOT NULL DEFAULT 'success',
  "proofUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderTracking" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "location" TEXT,
  "carrier" TEXT,
  "trackingNumber" TEXT,
  "estimatedDeliveryDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderTracking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PosDraft" (
  "id" TEXT NOT NULL,
  "cashierId" TEXT NOT NULL,
  "customerId" TEXT,
  "customerData" JSONB,
  "items" JSONB NOT NULL,
  "paymentMethod" "PaymentGateway" NOT NULL DEFAULT 'cash',
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deliveryType" TEXT NOT NULL DEFAULT 'pickup',
  "deliveryAddress" JSONB,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PosDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_variationId_idx" ON "OrderItem"("variationId");
CREATE INDEX "Transaction_orderId_idx" ON "Transaction"("orderId");
CREATE INDEX "OrderTracking_orderId_idx" ON "OrderTracking"("orderId");
CREATE INDEX "PosDraft_cashierId_idx" ON "PosDraft"("cashierId");

ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variationId_fkey" FOREIGN KEY ("variationId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderTracking" ADD CONSTRAINT "OrderTracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PosDraft" ADD CONSTRAINT "PosDraft_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
