-- AlterTable
ALTER TABLE `user_settings` ADD COLUMN `auto_fixed_day` INTEGER NOT NULL DEFAULT 27,
    ADD COLUMN `auto_fixed_enabled` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `auto_fixed_log` (
    `id` VARCHAR(26) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `year_month` VARCHAR(7) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `auto_fixed_log_user_month_key`(`user_id`, `year_month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

