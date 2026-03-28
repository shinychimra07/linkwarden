-- AlterTable
ALTER TABLE "Link" ADD COLUMN "shareToken" TEXT,
ADD COLUMN "isShared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sharedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Link_shareToken_key" ON "Link"("shareToken");
