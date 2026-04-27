-- CreateTable
CREATE TABLE "Gym" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'US',
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gym_pkey" PRIMARY KEY ("id")
);

-- Seed default gym required for Fighter.gymId FK
INSERT INTO "Gym" (
    "id",
    "name",
    "addressLine1",
    "city",
    "state",
    "postalCode",
    "countryCode",
    "timezone",
    "createdAt",
    "updatedAt"
) VALUES (
    'gym_default_01',
    'Default Gym',
    '1 Default St',
    'Los Angeles',
    'CA',
    '90001',
    'US',
    'America/Los_Angeles',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- AlterTable
ALTER TABLE "Fighter" ADD COLUMN     "gymId" TEXT NOT NULL DEFAULT 'gym_default_01';

-- CreateIndex
CREATE INDEX "Gym_name_idx" ON "Gym"("name");

-- CreateIndex
CREATE INDEX "Fighter_gymId_idx" ON "Fighter"("gymId");

-- AddForeignKey
ALTER TABLE "Fighter" ADD CONSTRAINT "Fighter_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
