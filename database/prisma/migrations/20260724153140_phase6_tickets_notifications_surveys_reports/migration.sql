-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('SUPPORT_REQUEST', 'OBLIGATION', 'BILLING', 'TECHNICAL', 'ACCOUNT', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'OPEN', 'WAITING_FOR_HATEF', 'WAITING_FOR_PARTNER', 'RESOLVED', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "NotificationChannelType" AS ENUM ('IN_APP', 'SMS', 'PUSH', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DEAD_LETTER', 'SKIPPED_QUIET_HOURS', 'SKIPPED_PREFERENCE');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReportRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportVisibility" AS ENUM ('PRIVATE', 'SHARED');

-- CreateEnum
CREATE TYPE "ReportSnapshotFormat" AS ENUM ('JSON', 'CSV');

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "channel_id" UUID,
    "category" "TicketCategory" NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "subject" TEXT NOT NULL,
    "sla_due_at" TIMESTAMP(3),
    "first_response_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "reopen_count" INTEGER NOT NULL DEFAULT 0,
    "assignee_id" UUID,
    "watcher_ids" UUID[],
    "linked_entity_type" TEXT,
    "linked_entity_id" UUID,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_internal_notes" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_internal_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_attachments" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "file_asset_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_status_events" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "from_status" "TicketStatus",
    "to_status" "TicketStatus" NOT NULL,
    "note" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "channel" "NotificationChannelType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "NotificationTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "deep_link" TEXT,
    "linked_entity_type" TEXT,
    "linked_entity_id" UUID,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "channel" "NotificationChannelType" NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "provider_message_id" TEXT,
    "dedupe_key" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "channel" "NotificationChannelType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_quiet_hours" (
    "user_id" UUID NOT NULL,
    "start_hour" INTEGER NOT NULL,
    "end_hour" INTEGER NOT NULL,

    CONSTRAINT "notification_quiet_hours_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "sms_delivery_logs" (
    "id" UUID NOT NULL,
    "notification_delivery_id" UUID,
    "mobile" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "sms_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" UUID NOT NULL,
    "form_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "target_channel_ids" UUID[],
    "opens_at" TIMESTAMP(3),
    "closes_at" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_definitions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataset_key" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "visibility" "ReportVisibility" NOT NULL DEFAULT 'PRIVATE',
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_runs" (
    "id" UUID NOT NULL,
    "report_definition_id" UUID,
    "dataset_key" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "status" "ReportRunStatus" NOT NULL DEFAULT 'PENDING',
    "row_count" INTEGER,
    "result_json" JSONB,
    "error" TEXT,
    "requested_by_id" UUID NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "report_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_snapshots" (
    "id" UUID NOT NULL,
    "report_run_id" UUID NOT NULL,
    "format" "ReportSnapshotFormat" NOT NULL,
    "content" TEXT NOT NULL,
    "row_count" INTEGER NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tickets_channel_id_idx" ON "tickets"("channel_id");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_assignee_id_idx" ON "tickets"("assignee_id");

-- CreateIndex
CREATE INDEX "tickets_linked_entity_type_linked_entity_id_idx" ON "tickets"("linked_entity_type", "linked_entity_id");

-- CreateIndex
CREATE INDEX "ticket_messages_ticket_id_idx" ON "ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_internal_notes_ticket_id_idx" ON "ticket_internal_notes"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_attachments_ticket_id_file_asset_id_key" ON "ticket_attachments"("ticket_id", "file_asset_id");

-- CreateIndex
CREATE INDEX "ticket_status_events_ticket_id_idx" ON "ticket_status_events"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_key_version_number_channel_key" ON "notification_templates"("key", "version_number", "channel");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_dedupe_key_key" ON "notification_deliveries"("dedupe_key");

-- CreateIndex
CREATE INDEX "notification_deliveries_notification_id_idx" ON "notification_deliveries"("notification_id");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_idx" ON "notification_deliveries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_event_type_channel_key" ON "notification_preferences"("user_id", "event_type", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "sms_delivery_logs_notification_delivery_id_key" ON "sms_delivery_logs"("notification_delivery_id");

-- CreateIndex
CREATE UNIQUE INDEX "surveys_form_id_key" ON "surveys"("form_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_definitions_key_key" ON "report_definitions"("key");

-- CreateIndex
CREATE INDEX "report_runs_status_idx" ON "report_runs"("status");

-- CreateIndex
CREATE INDEX "report_runs_report_definition_id_idx" ON "report_runs"("report_definition_id");

-- CreateIndex
CREATE INDEX "report_snapshots_report_run_id_idx" ON "report_snapshots"("report_run_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_internal_notes" ADD CONSTRAINT "ticket_internal_notes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_internal_notes" ADD CONSTRAINT "ticket_internal_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_status_events" ADD CONSTRAINT "ticket_status_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_quiet_hours" ADD CONSTRAINT "notification_quiet_hours_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_delivery_logs" ADD CONSTRAINT "sms_delivery_logs_notification_delivery_id_fkey" FOREIGN KEY ("notification_delivery_id") REFERENCES "notification_deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_definitions" ADD CONSTRAINT "report_definitions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_report_definition_id_fkey" FOREIGN KEY ("report_definition_id") REFERENCES "report_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_report_run_id_fkey" FOREIGN KEY ("report_run_id") REFERENCES "report_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
