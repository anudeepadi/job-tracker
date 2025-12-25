-- Migration: Add AI Agent Job Search Models
-- Description: Adds tables for storing AI agent job search sessions, results, and outputs

-- CreateTable: JobSearch
-- Represents a job search session initiated by the AI agent
CREATE TABLE "public"."JobSearch" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT,
    "numResults" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "JobSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable: JobResult
-- Individual job listings discovered during a search
CREATE TABLE "public"."JobResult" (
    "id" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "salary" TEXT,
    "description" TEXT,
    "applyUrl" TEXT,
    "sourceUrl" TEXT,
    "postedDate" TEXT,
    "jobType" TEXT,
    "remote" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedAsApplicationId" TEXT,
    "importedAt" TIMESTAMP(3),

    CONSTRAINT "JobResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AgentOutput
-- Stores full agent outputs (skills analysis, interview prep, etc.)
CREATE TABLE "public"."AgentOutput" (
    "id" TEXT NOT NULL,
    "searchId" TEXT,
    "agentType" TEXT NOT NULL,
    "prompt" TEXT,
    "output" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentOutput_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Application
-- Add aiSearchId column for linking applications to job searches
ALTER TABLE "public"."Application" ADD COLUMN "aiSearchId" TEXT;

-- CreateIndex: JobSearch indexes for efficient querying
CREATE INDEX "JobSearch_status_idx" ON "public"."JobSearch"("status");
CREATE INDEX "JobSearch_createdAt_idx" ON "public"."JobSearch"("createdAt");

-- CreateIndex: JobResult indexes for efficient querying
CREATE INDEX "JobResult_searchId_idx" ON "public"."JobResult"("searchId");
CREATE INDEX "JobResult_company_idx" ON "public"."JobResult"("company");
CREATE INDEX "JobResult_title_idx" ON "public"."JobResult"("title");

-- CreateIndex: Unique constraint on importedAsApplicationId
CREATE UNIQUE INDEX "JobResult_importedAsApplicationId_key" ON "public"."JobResult"("importedAsApplicationId");

-- CreateIndex: AgentOutput indexes for efficient querying
CREATE INDEX "AgentOutput_searchId_idx" ON "public"."AgentOutput"("searchId");
CREATE INDEX "AgentOutput_agentType_idx" ON "public"."AgentOutput"("agentType");
CREATE INDEX "AgentOutput_createdAt_idx" ON "public"."AgentOutput"("createdAt");

-- AddForeignKey: JobResult -> JobSearch (CASCADE delete)
ALTER TABLE "public"."JobResult" ADD CONSTRAINT "JobResult_searchId_fkey"
    FOREIGN KEY ("searchId") REFERENCES "public"."JobSearch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: AgentOutput -> JobSearch (SET NULL on delete)
ALTER TABLE "public"."AgentOutput" ADD CONSTRAINT "AgentOutput_searchId_fkey"
    FOREIGN KEY ("searchId") REFERENCES "public"."JobSearch"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Application -> JobSearch (SET NULL on delete)
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_aiSearchId_fkey"
    FOREIGN KEY ("aiSearchId") REFERENCES "public"."JobSearch"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
