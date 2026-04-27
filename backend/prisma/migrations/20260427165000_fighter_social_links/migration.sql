-- Add optional social link fields to Fighter
ALTER TABLE "Fighter"
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "xUrl" TEXT;

