-- Add Fighter.userId to link Fighter profile to User account
ALTER TABLE "Fighter" ADD COLUMN "userId" TEXT;

-- Nullable unique: allows many NULLs, but enforces 1:1 when set
CREATE UNIQUE INDEX "Fighter_userId_key" ON "Fighter"("userId");

