-- CreateTable
CREATE TABLE `ProjectShare` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `ownerUserId` VARCHAR(191) NOT NULL,
    `shareCode` VARCHAR(191) NOT NULL,
    `guestUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,

    UNIQUE INDEX `ProjectShare_shareCode_key`(`shareCode`),
    INDEX `ProjectShare_projectId_idx`(`projectId`),
    INDEX `ProjectShare_guestUserId_idx`(`guestUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectShare` ADD CONSTRAINT `ProjectShare_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectShare` ADD CONSTRAINT `ProjectShare_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectShare` ADD CONSTRAINT `ProjectShare_guestUserId_fkey` FOREIGN KEY (`guestUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
