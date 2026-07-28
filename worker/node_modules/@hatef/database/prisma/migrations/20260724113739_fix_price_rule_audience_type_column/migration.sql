-- Fixes a naming inconsistency: every other enum column in this schema is
-- explicitly @map()'d to snake_case; PriceRule.audienceType was missed.
-- A plain rename (not drop+add) so no data is lost.
ALTER TABLE "price_rules" RENAME COLUMN "audienceType" TO "audience_type";
