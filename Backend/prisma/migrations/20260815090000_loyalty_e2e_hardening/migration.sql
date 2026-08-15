-- Canonical redemption lifecycle. Existing rows are mapped explicitly so no
-- request is silently lost and no ledger entry is created by this migration.
ALTER TABLE "RedemptionRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "RedemptionStatus" RENAME TO "RedemptionStatus_legacy";
CREATE TYPE "RedemptionStatus" AS ENUM (
  'DRAFT',
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
  'PURCHASED',
  'PICKUP_SCHEDULED',
  'COMPLETED',
  'CANCELLED'
);

ALTER TABLE "RedemptionRequest"
  ALTER COLUMN "status" TYPE "RedemptionStatus"
  USING CASE "status"::text
    WHEN 'REQUESTED' THEN 'PENDING_VERIFICATION'::"RedemptionStatus"
    WHEN 'REVIEWED' THEN 'VERIFIED'::"RedemptionStatus"
    WHEN 'ACCEPTED' THEN 'PURCHASED'::"RedemptionStatus"
    WHEN 'REJECTED' THEN 'REJECTED'::"RedemptionStatus"
    WHEN 'CANCELLED' THEN 'CANCELLED'::"RedemptionStatus"
  END;

ALTER TABLE "RedemptionStatusHistory"
  ALTER COLUMN "previousStatus" TYPE "RedemptionStatus"
  USING CASE "previousStatus"::text
    WHEN 'REQUESTED' THEN 'PENDING_VERIFICATION'::"RedemptionStatus"
    WHEN 'REVIEWED' THEN 'VERIFIED'::"RedemptionStatus"
    WHEN 'ACCEPTED' THEN 'PURCHASED'::"RedemptionStatus"
    WHEN 'REJECTED' THEN 'REJECTED'::"RedemptionStatus"
    WHEN 'CANCELLED' THEN 'CANCELLED'::"RedemptionStatus"
  END;

ALTER TABLE "RedemptionStatusHistory"
  ALTER COLUMN "newStatus" TYPE "RedemptionStatus"
  USING CASE "newStatus"::text
    WHEN 'REQUESTED' THEN 'PENDING_VERIFICATION'::"RedemptionStatus"
    WHEN 'REVIEWED' THEN 'VERIFIED'::"RedemptionStatus"
    WHEN 'ACCEPTED' THEN 'PURCHASED'::"RedemptionStatus"
    WHEN 'REJECTED' THEN 'REJECTED'::"RedemptionStatus"
    WHEN 'CANCELLED' THEN 'CANCELLED'::"RedemptionStatus"
  END;

DROP TYPE "RedemptionStatus_legacy";
ALTER TABLE "RedemptionRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';

ALTER TABLE "TokenLedger" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "TokenLedger_idempotencyKey_key" ON "TokenLedger"("idempotencyKey");

ALTER TABLE "RedemptionRequest" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "RedemptionRequest_idempotencyKey_key" ON "RedemptionRequest"("idempotencyKey");

CREATE TABLE "PeriodSnapshot" (
  "id" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "division" "DivisionType",
  "cutoffAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "sourceHash" TEXT,
  "payload" JSONB NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PeriodSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PeriodSnapshot_periodKey_division_key" ON "PeriodSnapshot"("periodKey", "division");
CREATE UNIQUE INDEX "PeriodSnapshot_global_periodKey_key" ON "PeriodSnapshot"("periodKey") WHERE "division" IS NULL;
CREATE INDEX "PeriodSnapshot_cutoffAt_idx" ON "PeriodSnapshot"("cutoffAt" DESC);

CREATE TABLE "TokenRule" (
  "id" TEXT NOT NULL,
  "division" "DivisionType" NOT NULL,
  "tokensPerUnit" INTEGER NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TokenRule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TokenRule_division_key" ON "TokenRule"("division");
ALTER TABLE "TokenRule" ADD CONSTRAINT "TokenRule_tokensPerUnit_positive" CHECK ("tokensPerUnit" > 0);

-- Database-level defense in depth for the append-only ledger contract.
CREATE OR REPLACE FUNCTION "prevent_token_ledger_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'TokenLedger is append-only; UPDATE and DELETE are forbidden';
END;
$$;

CREATE TRIGGER "TokenLedger_append_only"
BEFORE UPDATE OR DELETE ON "TokenLedger"
FOR EACH ROW EXECUTE FUNCTION "prevent_token_ledger_mutation"();
