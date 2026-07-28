-- CreateEnum
CREATE TYPE "PromotionPricingModel" AS ENUM ('CALCULATED', 'QUOTE');

-- CreateEnum
CREATE TYPE "PromotionTypeVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AudienceType" AS ENUM ('NATIONWIDE', 'PROVINCIAL');

-- CreateEnum
CREATE TYPE "SupportRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VALIDATION', 'NEEDS_PARTNER_CHANGES', 'PRICING_OR_QUOTE', 'INTERNAL_APPROVAL', 'PARTNER_CONFIRMATION', 'SCHEDULED', 'RUNNING', 'RESULT_VERIFICATION', 'ADJUSTMENT_REQUIRED', 'COMPLETED', 'CANCEL_REQUESTED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PromotionQuoteStatus" AS ENUM ('DRAFT', 'SENT', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PromotionQuoteVersionStatus" AS ENUM ('PROPOSED', 'NEGOTIATION_REQUESTED', 'ACCEPTED', 'REJECTED', 'SUPERSEDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PromotionAssetKind" AS ENUM ('IMAGE', 'DOCUMENT');

-- CreateTable
CREATE TABLE "promotion_types" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricing_model" "PromotionPricingModel" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_type_versions" (
    "id" UUID NOT NULL,
    "promotion_type_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "PromotionTypeVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "effective_from" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_type_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_rules" (
    "id" UUID NOT NULL,
    "promotion_type_version_id" UUID NOT NULL,
    "audienceType" "AudienceType",
    "rate_per_view_rial" BIGINT NOT NULL,
    "min_amount_rial" BIGINT,
    "cap_amount_rial" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_requests" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "promotion_type_id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "status" "SupportRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "audience_type" "AudienceType",
    "province" TEXT,
    "requested_unique_views" INTEGER,
    "details" JSONB NOT NULL DEFAULT '{}',
    "current_revision_number" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_request_revisions" (
    "id" UUID NOT NULL,
    "support_request_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by" UUID NOT NULL,

    CONSTRAINT "support_request_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_request_status_events" (
    "id" UUID NOT NULL,
    "support_request_id" UUID NOT NULL,
    "from_status" "SupportRequestStatus",
    "to_status" "SupportRequestStatus" NOT NULL,
    "note" TEXT,
    "partner_visible" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_request_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_calculations" (
    "id" UUID NOT NULL,
    "support_request_id" UUID NOT NULL,
    "promotion_type_version_id" UUID NOT NULL,
    "requested_unique_views" INTEGER NOT NULL,
    "audience_type" "AudienceType" NOT NULL,
    "rate_per_view_rial" BIGINT NOT NULL,
    "base_amount_rial" BIGINT NOT NULL,
    "discount_rial" BIGINT NOT NULL DEFAULT 0,
    "multiplier_percent" INTEGER NOT NULL DEFAULT 100,
    "estimated_amount_rial" BIGINT NOT NULL,
    "line_items" JSONB NOT NULL,
    "override_amount_rial" BIGINT,
    "override_reason" TEXT,
    "requires_second_approval" BOOLEAN NOT NULL DEFAULT false,
    "approved_amount_rial" BIGINT,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "second_approved_by" UUID,
    "second_approved_at" TIMESTAMP(3),
    "reserved_amount_rial" BIGINT,
    "realized_amount_rial" BIGINT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_quotes" (
    "id" UUID NOT NULL,
    "support_request_id" UUID NOT NULL,
    "status" "PromotionQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_quote_versions" (
    "id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "PromotionQuoteVersionStatus" NOT NULL DEFAULT 'PROPOSED',
    "estimated_channel_min" INTEGER,
    "estimated_channel_max" INTEGER,
    "estimated_view_min" INTEGER,
    "estimated_view_max" INTEGER,
    "method" TEXT NOT NULL,
    "schedule_note" TEXT,
    "amount_rial" BIGINT NOT NULL,
    "assumptions" TEXT,
    "expires_at" TIMESTAMP(3),
    "negotiation_note" TEXT,
    "responded_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_quote_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_orders" (
    "id" UUID NOT NULL,
    "support_request_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "final_amount_rial" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_assets" (
    "id" UUID NOT NULL,
    "support_request_id" UUID NOT NULL,
    "file_asset_id" UUID NOT NULL,
    "kind" "PromotionAssetKind" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promotion_types_key_key" ON "promotion_types"("key");

-- CreateIndex
CREATE INDEX "promotion_type_versions_promotion_type_id_status_idx" ON "promotion_type_versions"("promotion_type_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_type_versions_promotion_type_id_version_number_key" ON "promotion_type_versions"("promotion_type_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "price_rules_promotion_type_version_id_audienceType_key" ON "price_rules"("promotion_type_version_id", "audienceType");

-- CreateIndex
CREATE INDEX "support_requests_channel_id_idx" ON "support_requests"("channel_id");

-- CreateIndex
CREATE INDEX "support_requests_status_idx" ON "support_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "support_request_revisions_support_request_id_revision_numbe_key" ON "support_request_revisions"("support_request_id", "revision_number");

-- CreateIndex
CREATE INDEX "support_request_status_events_support_request_id_idx" ON "support_request_status_events"("support_request_id");

-- CreateIndex
CREATE INDEX "price_calculations_support_request_id_idx" ON "price_calculations"("support_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_quotes_support_request_id_key" ON "promotion_quotes"("support_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_quote_versions_quote_id_version_number_key" ON "promotion_quote_versions"("quote_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_orders_support_request_id_key" ON "promotion_orders"("support_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_assets_support_request_id_file_asset_id_key" ON "promotion_assets"("support_request_id", "file_asset_id");

-- AddForeignKey
ALTER TABLE "promotion_type_versions" ADD CONSTRAINT "promotion_type_versions_promotion_type_id_fkey" FOREIGN KEY ("promotion_type_id") REFERENCES "promotion_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_promotion_type_version_id_fkey" FOREIGN KEY ("promotion_type_version_id") REFERENCES "promotion_type_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_promotion_type_id_fkey" FOREIGN KEY ("promotion_type_id") REFERENCES "promotion_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_request_revisions" ADD CONSTRAINT "support_request_revisions_support_request_id_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_request_status_events" ADD CONSTRAINT "support_request_status_events_support_request_id_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_calculations" ADD CONSTRAINT "price_calculations_support_request_id_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_calculations" ADD CONSTRAINT "price_calculations_promotion_type_version_id_fkey" FOREIGN KEY ("promotion_type_version_id") REFERENCES "promotion_type_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_quotes" ADD CONSTRAINT "promotion_quotes_support_request_id_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_quote_versions" ADD CONSTRAINT "promotion_quote_versions_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "promotion_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_orders" ADD CONSTRAINT "promotion_orders_support_request_id_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_orders" ADD CONSTRAINT "promotion_orders_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_assets" ADD CONSTRAINT "promotion_assets_support_request_id_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_assets" ADD CONSTRAINT "promotion_assets_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
