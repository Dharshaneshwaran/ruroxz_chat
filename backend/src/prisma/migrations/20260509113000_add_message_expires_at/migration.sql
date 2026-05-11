ALTER TABLE "Message" ADD COLUMN "isSnap" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Message" ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "Message"
SET "expiresAt" = "createdAt" + INTERVAL '24 hours'
WHERE "isSnap" = true AND "expiresAt" IS NULL;

CREATE INDEX "Message_expiresAt_idx" ON "Message"("expiresAt");
