-- CreateTable
CREATE TABLE "SavedAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "searchCriteria" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastJobCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedAlert_userId_idx" ON "SavedAlert"("userId");

-- CreateIndex
CREATE INDEX "SavedAlert_userId_isActive_idx" ON "SavedAlert"("userId", "isActive");

-- CreateIndex
CREATE INDEX "SavedAlert_frequency_isActive_idx" ON "SavedAlert"("frequency", "isActive");

-- AddForeignKey
ALTER TABLE "SavedAlert" ADD CONSTRAINT "SavedAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
