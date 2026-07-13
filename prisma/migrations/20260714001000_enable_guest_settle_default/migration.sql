-- Enable guest settlements by default for existing groups
ALTER TABLE "SplitGroup" ALTER COLUMN "guestCanSettle" SET DEFAULT true;
UPDATE "SplitGroup" SET "guestCanSettle" = true WHERE "guestCanSettle" = false;
