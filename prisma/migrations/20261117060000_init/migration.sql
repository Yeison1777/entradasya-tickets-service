CREATE TYPE "TicketStatus" AS ENUM ('VALID', 'CANCELLED');

CREATE TABLE "ticket_batches" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "event_id" UUID NOT NULL,
  "sector_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL,
  "issued_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ticket_batches_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ticket_batches_order_id_key" UNIQUE ("order_id"),
  CONSTRAINT "ticket_batches_quantity_check" CHECK ("quantity" BETWEEN 1 AND 6)
);

CREATE TABLE "tickets" (
  "id" UUID NOT NULL,
  "batch_id" UUID NOT NULL,
  "sequence" INTEGER NOT NULL,
  "code" VARCHAR(64) NOT NULL,
  "status" "TicketStatus" NOT NULL DEFAULT 'VALID',
  "pdf_path" VARCHAR(255) NOT NULL,
  "issued_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tickets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tickets_code_key" UNIQUE ("code"),
  CONSTRAINT "tickets_batch_id_sequence_key" UNIQUE ("batch_id", "sequence"),
  CONSTRAINT "tickets_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "ticket_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ticket_batches_customer_id_issued_at_idx" ON "ticket_batches"("customer_id", "issued_at");
CREATE INDEX "ticket_batches_event_id_idx" ON "ticket_batches"("event_id");
CREATE INDEX "tickets_batch_id_idx" ON "tickets"("batch_id");
