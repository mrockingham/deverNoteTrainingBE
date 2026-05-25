/*
  Warnings:

  - A unique constraint covering the columns `[providerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "LessonPlan" ADD COLUMN     "dependencies" JSONB,
ADD COLUMN     "sandpackTemplate" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiCreditsRemaining" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SandboxSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "sandpackTemplate" TEXT,
    "dependencies" JSONB,
    "files" JSONB NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lessonPlanId" TEXT,
    "lessonStepId" TEXT,
    "practiceSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SandboxSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SandboxSession_userId_idx" ON "SandboxSession"("userId");

-- CreateIndex
CREATE INDEX "SandboxSession_lessonPlanId_idx" ON "SandboxSession"("lessonPlanId");

-- CreateIndex
CREATE INDEX "SandboxSession_lessonStepId_idx" ON "SandboxSession"("lessonStepId");

-- CreateIndex
CREATE INDEX "SandboxSession_practiceSessionId_idx" ON "SandboxSession"("practiceSessionId");

-- CreateIndex
CREATE INDEX "SandboxSession_status_idx" ON "SandboxSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_providerId_key" ON "User"("providerId");

-- AddForeignKey
ALTER TABLE "SandboxSession" ADD CONSTRAINT "SandboxSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandboxSession" ADD CONSTRAINT "SandboxSession_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandboxSession" ADD CONSTRAINT "SandboxSession_lessonStepId_fkey" FOREIGN KEY ("lessonStepId") REFERENCES "LessonStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandboxSession" ADD CONSTRAINT "SandboxSession_practiceSessionId_fkey" FOREIGN KEY ("practiceSessionId") REFERENCES "PracticeSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
