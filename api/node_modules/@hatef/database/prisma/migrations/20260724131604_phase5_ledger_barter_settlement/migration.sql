-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('PUBLICATION', 'REPOST', 'CONTENT_PRODUCTION', 'EVENT_COVERAGE', 'CAMPAIGN_PARTICIPATION', 'FIELD_OPERATION', 'NETWORKING', 'RESEARCH', 'SURVEY', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceCatalogVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ObligationStatus" AS ENUM ('PROPOSED', 'NEGOTIATING', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'NEEDS_REVISION', 'PARTIALLY_APPROVED', 'APPROVED', 'DISPUTED', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ObligationProposalStatus" AS ENUM ('PROPOSED', 'COUNTERED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('SUBMITTED', 'NEEDS_REVISION', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('ACCEPT_FULL', 'ACCEPT_PARTIAL', 'REQUEST_REVISION', 'REJECT', 'DISPUTE');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESOLVED_REVERSED', 'RESOLVED_UPHELD');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('CHANNEL_SUPPORT_VALUE', 'CHANNEL_SERVICE_OBLIGATION', 'CHANNEL_SERVICE_DELIVERED', 'CHANNEL_SETTLEMENT', 'PLATFORM_SUPPORT_POOL', 'PLATFORM_SERVICE_POOL');

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('SUPPORT_GRANTED', 'SERVICE_ACCEPTED', 'SETTLEMENT', 'ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "LedgerEntryDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'REVERSED');

-- CreateEnum
CREATE TYPE "FinancialApprovalType" AS ENUM ('LEDGER_ADJUSTMENT', 'MANUAL_SETTLEMENT');

-- CreateEnum
CREATE TYPE "FinancialApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RateCardStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'NEGOTIATING', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RateCardItemStatus" AS ENUM ('PENDING', 'APPROVED', 'NEGOTIATING', 'ARCHIVED');

-- CreateTable
CREATE TABLE "service_catalog_items" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_catalog_versions" (
    "id" UUID NOT NULL,
    "service_catalog_item_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "ServiceCatalogVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "unit" TEXT NOT NULL,
    "valuation_method" TEXT NOT NULL,
    "default_acceptance_criteria" TEXT,
    "default_evidence" TEXT,
    "price_guidance_rial" BIGINT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_catalog_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_obligations" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "support_request_id" UUID,
    "service_catalog_item_id" UUID NOT NULL,
    "service_catalog_version_id" UUID NOT NULL,
    "status" "ObligationStatus" NOT NULL DEFAULT 'PROPOSED',
    "brief" TEXT NOT NULL,
    "output" TEXT,
    "acceptance_criteria" TEXT,
    "value_rial" BIGINT NOT NULL,
    "settled_value_rial" BIGINT NOT NULL DEFAULT 0,
    "start_at" TIMESTAMP(3),
    "deadline_at" TIMESTAMP(3),
    "responsible_channel_member_id" UUID,
    "responsible_hatef_employee_id" UUID,
    "terms" TEXT,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obligation_proposals" (
    "id" UUID NOT NULL,
    "obligation_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "proposed_by_id" UUID NOT NULL,
    "status" "ObligationProposalStatus" NOT NULL DEFAULT 'PROPOSED',
    "value_rial" BIGINT NOT NULL,
    "brief" TEXT,
    "deadline_at" TIMESTAMP(3),
    "note" TEXT,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obligation_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obligation_status_events" (
    "id" UUID NOT NULL,
    "obligation_id" UUID NOT NULL,
    "from_status" "ObligationStatus",
    "to_status" "ObligationStatus" NOT NULL,
    "note" TEXT,
    "partner_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obligation_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obligation_attachments" (
    "id" UUID NOT NULL,
    "obligation_id" UUID NOT NULL,
    "file_asset_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obligation_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverables" (
    "id" UUID NOT NULL,
    "obligation_id" UUID NOT NULL,
    "submitted_by_id" UUID NOT NULL,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'SUBMITTED',
    "description" TEXT,
    "links" JSONB NOT NULL DEFAULT '[]',
    "reach_or_views" INTEGER,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_attachments" (
    "id" UUID NOT NULL,
    "deliverable_id" UUID NOT NULL,
    "file_asset_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliverable_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_reviews" (
    "id" UUID NOT NULL,
    "deliverable_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "accepted_value_rial" BIGINT,
    "remaining_value_rial" BIGINT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliverable_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "obligation_id" UUID NOT NULL,
    "deliverable_id" UUID,
    "raised_by_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution_note" TEXT,
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_accounts" (
    "id" UUID NOT NULL,
    "channel_id" UUID,
    "account_type" "LedgerAccountType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" UUID NOT NULL,
    "transaction_type" "LedgerTransactionType" NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT,
    "description" TEXT,
    "reason" TEXT,
    "reversal_of_transaction_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "direction" "LedgerEntryDirection" NOT NULL,
    "amount_rial" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'DRAFT',
    "total_amount_rial" BIGINT NOT NULL,
    "statement_note" TEXT,
    "ledger_transaction_id" UUID,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_allocations" (
    "id" UUID NOT NULL,
    "settlement_id" UUID NOT NULL,
    "obligation_id" UUID NOT NULL,
    "deliverable_id" UUID,
    "amount_rial" BIGINT NOT NULL,

    CONSTRAINT "settlement_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_approval_requests" (
    "id" UUID NOT NULL,
    "type" "FinancialApprovalType" NOT NULL,
    "channel_id" UUID NOT NULL,
    "amount_rial" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "FinancialApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requested_by_id" UUID NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_by_id" UUID,
    "decided_at" TIMESTAMP(3),
    "decision_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_rate_cards" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "RateCardStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_card_items" (
    "id" UUID NOT NULL,
    "rate_card_id" UUID NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price_unit" TEXT NOT NULL,
    "amount_rial" BIGINT NOT NULL,
    "minimum_order" INTEGER,
    "lead_time_days" INTEGER,
    "monthly_capacity" INTEGER,
    "terms" TEXT,
    "sample_work_url" TEXT,
    "effective_from" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "status" "RateCardItemStatus" NOT NULL DEFAULT 'PENDING',
    "admin_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_card_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_catalog_items_key_key" ON "service_catalog_items"("key");

-- CreateIndex
CREATE INDEX "service_catalog_versions_service_catalog_item_id_status_idx" ON "service_catalog_versions"("service_catalog_item_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "service_catalog_versions_service_catalog_item_id_version_nu_key" ON "service_catalog_versions"("service_catalog_item_id", "version_number");

-- CreateIndex
CREATE INDEX "service_obligations_channel_id_idx" ON "service_obligations"("channel_id");

-- CreateIndex
CREATE INDEX "service_obligations_status_idx" ON "service_obligations"("status");

-- CreateIndex
CREATE INDEX "service_obligations_support_request_id_idx" ON "service_obligations"("support_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "obligation_proposals_obligation_id_version_number_key" ON "obligation_proposals"("obligation_id", "version_number");

-- CreateIndex
CREATE INDEX "obligation_status_events_obligation_id_idx" ON "obligation_status_events"("obligation_id");

-- CreateIndex
CREATE UNIQUE INDEX "obligation_attachments_obligation_id_file_asset_id_key" ON "obligation_attachments"("obligation_id", "file_asset_id");

-- CreateIndex
CREATE INDEX "deliverables_obligation_id_idx" ON "deliverables"("obligation_id");

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_attachments_deliverable_id_file_asset_id_key" ON "deliverable_attachments"("deliverable_id", "file_asset_id");

-- CreateIndex
CREATE INDEX "deliverable_reviews_deliverable_id_idx" ON "deliverable_reviews"("deliverable_id");

-- CreateIndex
CREATE INDEX "disputes_obligation_id_idx" ON "disputes"("obligation_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_accounts_channel_id_account_type_key" ON "ledger_accounts"("channel_id", "account_type");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_idempotency_key_key" ON "ledger_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "ledger_transactions_source_type_source_id_idx" ON "ledger_transactions"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "ledger_entries_transaction_id_idx" ON "ledger_entries"("transaction_id");

-- CreateIndex
CREATE INDEX "ledger_entries_account_id_idx" ON "ledger_entries"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_ledger_transaction_id_key" ON "settlements"("ledger_transaction_id");

-- CreateIndex
CREATE INDEX "settlements_channel_id_idx" ON "settlements"("channel_id");

-- CreateIndex
CREATE INDEX "settlement_allocations_settlement_id_idx" ON "settlement_allocations"("settlement_id");

-- CreateIndex
CREATE INDEX "settlement_allocations_obligation_id_idx" ON "settlement_allocations"("obligation_id");

-- CreateIndex
CREATE INDEX "financial_approval_requests_channel_id_idx" ON "financial_approval_requests"("channel_id");

-- CreateIndex
CREATE INDEX "financial_approval_requests_status_idx" ON "financial_approval_requests"("status");

-- CreateIndex
CREATE INDEX "channel_rate_cards_channel_id_status_idx" ON "channel_rate_cards"("channel_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "channel_rate_cards_channel_id_version_number_key" ON "channel_rate_cards"("channel_id", "version_number");

-- CreateIndex
CREATE INDEX "rate_card_items_rate_card_id_idx" ON "rate_card_items"("rate_card_id");

-- AddForeignKey
ALTER TABLE "service_catalog_versions" ADD CONSTRAINT "service_catalog_versions_service_catalog_item_id_fkey" FOREIGN KEY ("service_catalog_item_id") REFERENCES "service_catalog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_obligations" ADD CONSTRAINT "service_obligations_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_obligations" ADD CONSTRAINT "service_obligations_support_request_id_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_obligations" ADD CONSTRAINT "service_obligations_service_catalog_item_id_fkey" FOREIGN KEY ("service_catalog_item_id") REFERENCES "service_catalog_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_obligations" ADD CONSTRAINT "service_obligations_service_catalog_version_id_fkey" FOREIGN KEY ("service_catalog_version_id") REFERENCES "service_catalog_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_obligations" ADD CONSTRAINT "service_obligations_responsible_channel_member_id_fkey" FOREIGN KEY ("responsible_channel_member_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_obligations" ADD CONSTRAINT "service_obligations_responsible_hatef_employee_id_fkey" FOREIGN KEY ("responsible_hatef_employee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_obligations" ADD CONSTRAINT "service_obligations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligation_proposals" ADD CONSTRAINT "obligation_proposals_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "service_obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligation_proposals" ADD CONSTRAINT "obligation_proposals_proposed_by_id_fkey" FOREIGN KEY ("proposed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligation_status_events" ADD CONSTRAINT "obligation_status_events_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "service_obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligation_attachments" ADD CONSTRAINT "obligation_attachments_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "service_obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligation_attachments" ADD CONSTRAINT "obligation_attachments_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "service_obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_attachments" ADD CONSTRAINT "deliverable_attachments_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_attachments" ADD CONSTRAINT "deliverable_attachments_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_reviews" ADD CONSTRAINT "deliverable_reviews_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_reviews" ADD CONSTRAINT "deliverable_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "service_obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raised_by_id_fkey" FOREIGN KEY ("raised_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_reversal_of_transaction_id_fkey" FOREIGN KEY ("reversal_of_transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_allocations" ADD CONSTRAINT "settlement_allocations_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_allocations" ADD CONSTRAINT "settlement_allocations_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "service_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_allocations" ADD CONSTRAINT "settlement_allocations_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_approval_requests" ADD CONSTRAINT "financial_approval_requests_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_approval_requests" ADD CONSTRAINT "financial_approval_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_approval_requests" ADD CONSTRAINT "financial_approval_requests_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_rate_cards" ADD CONSTRAINT "channel_rate_cards_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_card_items" ADD CONSTRAINT "rate_card_items_rate_card_id_fkey" FOREIGN KEY ("rate_card_id") REFERENCES "channel_rate_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
