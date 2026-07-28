-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'READY', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'BACKLOG',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignee_id" UUID,
    "created_by_id" UUID NOT NULL,
    "watcher_ids" UUID[],
    "channel_id" UUID,
    "linked_entity_type" TEXT,
    "linked_entity_id" UUID,
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "estimate_minutes" INTEGER,
    "reminder_at" TIMESTAMP(3),
    "checklist_items" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_dependencies" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "depends_on_task_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_attachments" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "file_asset_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_status_events" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "from_status" "TaskStatus",
    "to_status" "TaskStatus" NOT NULL,
    "note" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "channel_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_notes" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT NOT NULL,
    "channel_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacity_resources" (
    "id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "capacity_per_day" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capacity_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_schedules" (
    "id" UUID NOT NULL,
    "promotion_order_id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "capacity_resource_id" UUID,
    "scheduled_start_at" TIMESTAMP(3) NOT NULL,
    "scheduled_end_at" TIMESTAMP(3),
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_execution_results" (
    "id" UUID NOT NULL,
    "promotion_order_id" UUID NOT NULL,
    "actual_unique_views" INTEGER,
    "actual_channels_count" INTEGER,
    "realized_value_rial" BIGINT,
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_execution_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_result_evidence" (
    "id" UUID NOT NULL,
    "promotion_execution_result_id" UUID NOT NULL,
    "file_asset_id" UUID NOT NULL,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_result_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_assignee_id_idx" ON "tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_channel_id_idx" ON "tasks"("channel_id");

-- CreateIndex
CREATE INDEX "tasks_linked_entity_type_linked_entity_id_idx" ON "tasks"("linked_entity_type", "linked_entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_task_id_depends_on_task_id_key" ON "task_dependencies"("task_id", "depends_on_task_id");

-- CreateIndex
CREATE INDEX "task_comments_task_id_idx" ON "task_comments"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_attachments_task_id_file_asset_id_key" ON "task_attachments"("task_id", "file_asset_id");

-- CreateIndex
CREATE INDEX "task_status_events_task_id_idx" ON "task_status_events"("task_id");

-- CreateIndex
CREATE INDEX "calendar_events_start_at_idx" ON "calendar_events"("start_at");

-- CreateIndex
CREATE INDEX "date_notes_date_idx" ON "date_notes"("date");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_schedules_promotion_order_id_key" ON "promotion_schedules"("promotion_order_id");

-- CreateIndex
CREATE INDEX "promotion_schedules_operator_id_scheduled_start_at_idx" ON "promotion_schedules"("operator_id", "scheduled_start_at");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_execution_results_promotion_order_id_key" ON "promotion_execution_results"("promotion_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_result_evidence_promotion_execution_result_id_fil_key" ON "promotion_result_evidence"("promotion_execution_result_id", "file_asset_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_fkey" FOREIGN KEY ("depends_on_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_status_events" ADD CONSTRAINT "task_status_events_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_notes" ADD CONSTRAINT "date_notes_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacity_resources" ADD CONSTRAINT "capacity_resources_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_schedules" ADD CONSTRAINT "promotion_schedules_promotion_order_id_fkey" FOREIGN KEY ("promotion_order_id") REFERENCES "promotion_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_schedules" ADD CONSTRAINT "promotion_schedules_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_schedules" ADD CONSTRAINT "promotion_schedules_capacity_resource_id_fkey" FOREIGN KEY ("capacity_resource_id") REFERENCES "capacity_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_execution_results" ADD CONSTRAINT "promotion_execution_results_promotion_order_id_fkey" FOREIGN KEY ("promotion_order_id") REFERENCES "promotion_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_result_evidence" ADD CONSTRAINT "promotion_result_evidence_promotion_execution_result_id_fkey" FOREIGN KEY ("promotion_execution_result_id") REFERENCES "promotion_execution_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_result_evidence" ADD CONSTRAINT "promotion_result_evidence_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "price_rules_promotion_type_version_id_audienceType_key" RENAME TO "price_rules_promotion_type_version_id_audience_type_key";
