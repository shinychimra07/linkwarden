-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "searchQuery" TEXT NOT NULL DEFAULT '',
    "collectionId" INTEGER,
    "icon" TEXT NOT NULL DEFAULT '',
    "sortBy" TEXT NOT NULL DEFAULT 'createdAt',
    "sortOrder" TEXT NOT NULL DEFAULT 'desc',
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SavedSearchToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SavedSearchToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "SavedSearch_ownerId_idx" ON "SavedSearch"("ownerId");

-- CreateIndex
CREATE INDEX "_SavedSearchToTag_B_index" ON "_SavedSearchToTag"("B");

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SavedSearchToTag" ADD CONSTRAINT "_SavedSearchToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "SavedSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SavedSearchToTag" ADD CONSTRAINT "_SavedSearchToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
