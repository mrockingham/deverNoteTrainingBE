/*
  Warnings:

  - You are about to drop the column `creator` on the `CodeBlock` table. All the data in the column will be lost.
  - You are about to drop the column `creator` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `Agenda` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lesson` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserProgress` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `creatorId` to the `CodeBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CodeBlock" DROP CONSTRAINT "CodeBlock_creator_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_agendaId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_creator_fkey";

-- DropForeignKey
ALTER TABLE "UserProgress" DROP CONSTRAINT "UserProgress_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "UserProgress" DROP CONSTRAINT "UserProgress_userId_fkey";

-- AlterTable
ALTER TABLE "CodeBlock" DROP COLUMN "creator",
ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "lessonPlanId" TEXT,
ADD COLUMN     "lessonStepId" TEXT,
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'manual';

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "creator",
ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userImageId" TEXT;

-- DropTable
DROP TABLE "Agenda";

-- DropTable
DROP TABLE "Lesson";

-- DropTable
DROP TABLE "UserProgress";

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "focus" TEXT,
    "notes" TEXT,
    "description" TEXT,
    "sourcePrompt" TEXT,
    "aiSummary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonStep" (
    "id" TEXT NOT NULL,
    "lessonPlanId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "phaseTitle" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" JSONB NOT NULL,
    "hints" JSONB,
    "scaffoldFiles" JSONB,
    "starterFiles" JSONB,
    "solutionFiles" JSONB NOT NULL,
    "verificationRules" JSONB,
    "snippetExports" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonPlanId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "currentRep" INTEGER NOT NULL DEFAULT 1,
    "bestRep" INTEGER NOT NULL DEFAULT 0,
    "totalReps" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonStepId" TEXT NOT NULL,
    "practiceSessionId" TEXT,
    "repNumber" INTEGER NOT NULL,
    "submittedFiles" JSONB NOT NULL,
    "normalizedFiles" JSONB,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER,
    "feedback" JSONB,
    "aiDiffUsed" BOOLEAN NOT NULL DEFAULT false,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StepAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonPlan_creatorId_idx" ON "LessonPlan"("creatorId");

-- CreateIndex
CREATE INDEX "LessonPlan_status_idx" ON "LessonPlan"("status");

-- CreateIndex
CREATE INDEX "LessonStep_lessonPlanId_idx" ON "LessonStep"("lessonPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonStep_lessonPlanId_orderIndex_key" ON "LessonStep"("lessonPlanId", "orderIndex");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_idx" ON "PracticeSession"("userId");

-- CreateIndex
CREATE INDEX "PracticeSession_lessonPlanId_idx" ON "PracticeSession"("lessonPlanId");

-- CreateIndex
CREATE INDEX "PracticeSession_status_idx" ON "PracticeSession"("status");

-- CreateIndex
CREATE INDEX "StepAttempt_userId_idx" ON "StepAttempt"("userId");

-- CreateIndex
CREATE INDEX "StepAttempt_lessonStepId_idx" ON "StepAttempt"("lessonStepId");

-- CreateIndex
CREATE INDEX "StepAttempt_practiceSessionId_idx" ON "StepAttempt"("practiceSessionId");

-- CreateIndex
CREATE INDEX "StepAttempt_repNumber_idx" ON "StepAttempt"("repNumber");

-- CreateIndex
CREATE INDEX "CodeBlock_creatorId_idx" ON "CodeBlock"("creatorId");

-- CreateIndex
CREATE INDEX "CodeBlock_lessonPlanId_idx" ON "CodeBlock"("lessonPlanId");

-- CreateIndex
CREATE INDEX "CodeBlock_lessonStepId_idx" ON "CodeBlock"("lessonStepId");

-- CreateIndex
CREATE INDEX "Project_creatorId_idx" ON "Project"("creatorId");

-- AddForeignKey
ALTER TABLE "CodeBlock" ADD CONSTRAINT "CodeBlock_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeBlock" ADD CONSTRAINT "CodeBlock_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeBlock" ADD CONSTRAINT "CodeBlock_lessonStepId_fkey" FOREIGN KEY ("lessonStepId") REFERENCES "LessonStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonStep" ADD CONSTRAINT "LessonStep_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepAttempt" ADD CONSTRAINT "StepAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepAttempt" ADD CONSTRAINT "StepAttempt_lessonStepId_fkey" FOREIGN KEY ("lessonStepId") REFERENCES "LessonStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepAttempt" ADD CONSTRAINT "StepAttempt_practiceSessionId_fkey" FOREIGN KEY ("practiceSessionId") REFERENCES "PracticeSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
