-- CreateEnum
CREATE TYPE "FormVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('TEXT', 'LONG_TEXT', 'PHONE', 'NUMBER', 'JALALI_DATE', 'SINGLE_SELECT', 'MULTI_SELECT', 'REPEATABLE_GROUP', 'IMAGE', 'DOCUMENT', 'LINK', 'CONSENT');

-- CreateEnum
CREATE TYPE "FormRuleAction" AS ENUM ('SHOW', 'REQUIRE', 'HIDE');

-- CreateEnum
CREATE TYPE "FormSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "EvaluationCaseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IDENTITY_CHECK', 'UNDER_REVIEW', 'NEEDS_CHANGES', 'RESUBMITTED', 'APPROVED', 'CONDITIONALLY_APPROVED', 'WAITLISTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvaluationAssignmentRole" AS ENUM ('EVALUATOR', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "RubricStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EvaluationDecisionType" AS ENUM ('APPROVED', 'CONDITIONALLY_APPROVED', 'WAITLISTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InformationRequestStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "forms" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_versions" (
    "id" UUID NOT NULL,
    "form_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "FormVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_pages" (
    "id" UUID NOT NULL,
    "form_version_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "form_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_sections" (
    "id" UUID NOT NULL,
    "form_page_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "form_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" UUID NOT NULL,
    "form_section_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FormFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "help_text" TEXT,
    "placeholder" TEXT,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_field_options" (
    "id" UUID NOT NULL,
    "form_field_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "form_field_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_rules" (
    "id" UUID NOT NULL,
    "form_version_id" UUID NOT NULL,
    "target_field_id" UUID NOT NULL,
    "action" "FormRuleAction" NOT NULL,
    "condition" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" UUID NOT NULL,
    "form_version_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "submitter_id" UUID NOT NULL,
    "status" "FormSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "current_revision_number" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3),
    "last_autosave_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_answers" (
    "id" UUID NOT NULL,
    "form_submission_id" UUID NOT NULL,
    "form_field_id" UUID NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submission_revisions" (
    "id" UUID NOT NULL,
    "form_submission_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by" UUID NOT NULL,

    CONSTRAINT "form_submission_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_documents" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_acceptances" (
    "id" UUID NOT NULL,
    "consent_document_id" UUID NOT NULL,
    "form_submission_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,

    CONSTRAINT "consent_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_cases" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "form_submission_id" UUID NOT NULL,
    "status" "EvaluationCaseStatus" NOT NULL DEFAULT 'DRAFT',
    "sla_due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_assignments" (
    "id" UUID NOT NULL,
    "evaluation_case_id" UUID NOT NULL,
    "evaluator_id" UUID NOT NULL,
    "role" "EvaluationAssignmentRole" NOT NULL,
    "conflict_declared" BOOLEAN NOT NULL DEFAULT false,
    "conflict_note" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),

    CONSTRAINT "evaluation_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_rubrics" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "status" "RubricStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_rubrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_scores" (
    "id" UUID NOT NULL,
    "evaluation_case_id" UUID NOT NULL,
    "rubric_id" UUID NOT NULL,
    "evaluator_id" UUID NOT NULL,
    "scores" JSONB NOT NULL,
    "confidence" INTEGER NOT NULL,
    "override_reason" TEXT,
    "supervisor_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_decisions" (
    "id" UUID NOT NULL,
    "evaluation_case_id" UUID NOT NULL,
    "decision" "EvaluationDecisionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "partner_visible_reason" TEXT NOT NULL,
    "decided_by" UUID NOT NULL,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "information_requests" (
    "id" UUID NOT NULL,
    "evaluation_case_id" UUID NOT NULL,
    "requested_field_keys" JSONB NOT NULL,
    "message" TEXT NOT NULL,
    "status" "InformationRequestStatus" NOT NULL DEFAULT 'OPEN',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "information_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_notes" (
    "id" UUID NOT NULL,
    "evaluation_case_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_status_events" (
    "id" UUID NOT NULL,
    "evaluation_case_id" UUID NOT NULL,
    "from_status" "EvaluationCaseStatus",
    "to_status" "EvaluationCaseStatus" NOT NULL,
    "note" TEXT,
    "partner_visible" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forms_key_key" ON "forms"("key");

-- CreateIndex
CREATE INDEX "form_versions_form_id_status_idx" ON "form_versions"("form_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "form_versions_form_id_version_number_key" ON "form_versions"("form_id", "version_number");

-- CreateIndex
CREATE INDEX "form_pages_form_version_id_idx" ON "form_pages"("form_version_id");

-- CreateIndex
CREATE INDEX "form_sections_form_page_id_idx" ON "form_sections"("form_page_id");

-- CreateIndex
CREATE INDEX "form_fields_form_section_id_idx" ON "form_fields"("form_section_id");

-- CreateIndex
CREATE INDEX "form_field_options_form_field_id_idx" ON "form_field_options"("form_field_id");

-- CreateIndex
CREATE INDEX "form_rules_form_version_id_idx" ON "form_rules"("form_version_id");

-- CreateIndex
CREATE INDEX "form_submissions_channel_id_idx" ON "form_submissions"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_answers_form_submission_id_form_field_id_key" ON "form_answers"("form_submission_id", "form_field_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_submission_revisions_form_submission_id_revision_numbe_key" ON "form_submission_revisions"("form_submission_id", "revision_number");

-- CreateIndex
CREATE UNIQUE INDEX "consent_documents_key_version_key" ON "consent_documents"("key", "version");

-- CreateIndex
CREATE INDEX "consent_acceptances_form_submission_id_idx" ON "consent_acceptances"("form_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_cases_form_submission_id_key" ON "evaluation_cases"("form_submission_id");

-- CreateIndex
CREATE INDEX "evaluation_cases_channel_id_idx" ON "evaluation_cases"("channel_id");

-- CreateIndex
CREATE INDEX "evaluation_cases_status_idx" ON "evaluation_cases"("status");

-- CreateIndex
CREATE INDEX "evaluation_assignments_evaluation_case_id_idx" ON "evaluation_assignments"("evaluation_case_id");

-- CreateIndex
CREATE INDEX "evaluation_assignments_evaluator_id_idx" ON "evaluation_assignments"("evaluator_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_rubrics_key_version_number_key" ON "evaluation_rubrics"("key", "version_number");

-- CreateIndex
CREATE INDEX "evaluation_scores_evaluation_case_id_idx" ON "evaluation_scores"("evaluation_case_id");

-- CreateIndex
CREATE INDEX "evaluation_decisions_evaluation_case_id_idx" ON "evaluation_decisions"("evaluation_case_id");

-- CreateIndex
CREATE INDEX "information_requests_evaluation_case_id_idx" ON "information_requests"("evaluation_case_id");

-- CreateIndex
CREATE INDEX "evaluation_notes_evaluation_case_id_idx" ON "evaluation_notes"("evaluation_case_id");

-- CreateIndex
CREATE INDEX "evaluation_status_events_evaluation_case_id_idx" ON "evaluation_status_events"("evaluation_case_id");

-- AddForeignKey
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_pages" ADD CONSTRAINT "form_pages_form_version_id_fkey" FOREIGN KEY ("form_version_id") REFERENCES "form_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_sections" ADD CONSTRAINT "form_sections_form_page_id_fkey" FOREIGN KEY ("form_page_id") REFERENCES "form_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_section_id_fkey" FOREIGN KEY ("form_section_id") REFERENCES "form_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_field_options" ADD CONSTRAINT "form_field_options_form_field_id_fkey" FOREIGN KEY ("form_field_id") REFERENCES "form_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_rules" ADD CONSTRAINT "form_rules_form_version_id_fkey" FOREIGN KEY ("form_version_id") REFERENCES "form_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_rules" ADD CONSTRAINT "form_rules_target_field_id_fkey" FOREIGN KEY ("target_field_id") REFERENCES "form_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_version_id_fkey" FOREIGN KEY ("form_version_id") REFERENCES "form_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answers" ADD CONSTRAINT "form_answers_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answers" ADD CONSTRAINT "form_answers_form_field_id_fkey" FOREIGN KEY ("form_field_id") REFERENCES "form_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submission_revisions" ADD CONSTRAINT "form_submission_revisions_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_acceptances" ADD CONSTRAINT "consent_acceptances_consent_document_id_fkey" FOREIGN KEY ("consent_document_id") REFERENCES "consent_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_acceptances" ADD CONSTRAINT "consent_acceptances_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_acceptances" ADD CONSTRAINT "consent_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_cases" ADD CONSTRAINT "evaluation_cases_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_cases" ADD CONSTRAINT "evaluation_cases_form_submission_id_fkey" FOREIGN KEY ("form_submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_assignments" ADD CONSTRAINT "evaluation_assignments_evaluation_case_id_fkey" FOREIGN KEY ("evaluation_case_id") REFERENCES "evaluation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_assignments" ADD CONSTRAINT "evaluation_assignments_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_evaluation_case_id_fkey" FOREIGN KEY ("evaluation_case_id") REFERENCES "evaluation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_rubric_id_fkey" FOREIGN KEY ("rubric_id") REFERENCES "evaluation_rubrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_decisions" ADD CONSTRAINT "evaluation_decisions_evaluation_case_id_fkey" FOREIGN KEY ("evaluation_case_id") REFERENCES "evaluation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "information_requests" ADD CONSTRAINT "information_requests_evaluation_case_id_fkey" FOREIGN KEY ("evaluation_case_id") REFERENCES "evaluation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_notes" ADD CONSTRAINT "evaluation_notes_evaluation_case_id_fkey" FOREIGN KEY ("evaluation_case_id") REFERENCES "evaluation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_status_events" ADD CONSTRAINT "evaluation_status_events_evaluation_case_id_fkey" FOREIGN KEY ("evaluation_case_id") REFERENCES "evaluation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
