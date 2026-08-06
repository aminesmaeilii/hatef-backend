ALTER TABLE "form_submissions" ADD COLUMN "tracking_code" TEXT;

CREATE UNIQUE INDEX "form_submissions_tracking_code_key" ON "form_submissions"("tracking_code");
CREATE INDEX "form_submissions_tracking_code_idx" ON "form_submissions"("tracking_code");
