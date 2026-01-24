-- DailyFix Database Schema
-- Run this script to create all tables manually

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS dailyfix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dailyfix;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fullName` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NULL,
  `provider` ENUM('local', 'google') DEFAULT 'local',
  `googleId` VARCHAR(255) NULL UNIQUE,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks table
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `dueDate` DATETIME NULL,
  `completed` BOOLEAN DEFAULT FALSE,
  `priority` ENUM('lowest', 'low', 'medium', 'high', 'highest') DEFAULT 'medium',
  `status` ENUM('todo', 'in-progress', 'in-review', 'done') DEFAULT 'todo',
  `assignee` VARCHAR(255) NULL,
  `reporter` VARCHAR(255) NULL,
  `labels` JSON NULL,
  `storyPoints` INT NULL,
  `category` VARCHAR(255) NULL,
  `reminder` DATETIME NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_userId_status` (`userId`, `status`),
  INDEX `idx_userId_dueDate` (`userId`, `dueDate`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events table
CREATE TABLE IF NOT EXISTS `events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `startDate` DATETIME NOT NULL,
  `endDate` DATETIME NULL,
  `description` TEXT NULL,
  `type` ENUM('task', 'event', 'reminder') DEFAULT 'event',
  `color` VARCHAR(50) DEFAULT '#3b82f6',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_userId_startDate` (`userId`, `startDate`),
  INDEX `idx_userId_type` (`userId`, `type`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meals table
CREATE TABLE IF NOT EXISTS `meals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
  `calories` INT NULL,
  `date` DATETIME NOT NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Physical Activities table
CREATE TABLE IF NOT EXISTS `physical_activities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `type` VARCHAR(255) NOT NULL,
  `duration` INT NOT NULL,
  `calories` INT NULL,
  `date` DATETIME NOT NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sleep Records table
CREATE TABLE IF NOT EXISTS `sleep_records` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `date` DATETIME NOT NULL,
  `sleepTime` DATETIME NOT NULL,
  `wakeTime` DATETIME NOT NULL,
  `quality` ENUM('poor', 'fair', 'good', 'excellent') DEFAULT 'good',
  `hours` DECIMAL(4,2) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Water Intakes table
CREATE TABLE IF NOT EXISTS `water_intakes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `date` DATETIME NOT NULL,
  `amount` DECIMAL(5,2) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meditation Sessions table
CREATE TABLE IF NOT EXISTS `meditation_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `date` DATETIME NOT NULL,
  `duration` INT NOT NULL,
  `type` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses table
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `category` ENUM('food', 'shopping', 'health', 'leisure', 'transport', 'bills', 'other') NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `date` DATETIME NOT NULL,
  `paymentMethod` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Budgets table
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `limit` DECIMAL(10,2) NOT NULL,
  `period` ENUM('weekly', 'monthly', 'yearly') NOT NULL,
  `spent` DECIMAL(10,2) DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Savings Goals table
CREATE TABLE IF NOT EXISTS `savings_goals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `targetAmount` DECIMAL(10,2) NOT NULL,
  `currentAmount` DECIMAL(10,2) DEFAULT 0,
  `deadline` DATETIME NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Salaries table
CREATE TABLE IF NOT EXISTS `salaries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `period` ENUM('monthly', 'yearly') NOT NULL,
  `date` DATETIME NOT NULL,
  `description` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shopping Lists table
CREATE TABLE IF NOT EXISTS `shopping_lists` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `items` JSON NOT NULL DEFAULT '[]',
  `completed` BOOLEAN DEFAULT FALSE,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Household Tasks table
CREATE TABLE IF NOT EXISTS `household_tasks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `frequency` ENUM('daily', 'weekly', 'monthly', 'one-time') NOT NULL,
  `dueDate` DATETIME NULL,
  `completed` BOOLEAN DEFAULT FALSE,
  `lastCompleted` DATETIME NULL,
  `nextDueDate` DATETIME NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Journal Entries table
CREATE TABLE IF NOT EXISTS `journal_entries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `date` DATETIME NOT NULL,
  `title` VARCHAR(255) NULL,
  `content` TEXT NOT NULL,
  `mood` ENUM('very-happy', 'happy', 'neutral', 'sad', 'very-sad') NULL,
  `tags` JSON NULL DEFAULT '[]',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Personal Goals table
CREATE TABLE IF NOT EXISTS `personal_goals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `targetDate` DATETIME NULL,
  `progress` INT DEFAULT 0,
  `completed` BOOLEAN DEFAULT FALSE,
  `category` ENUM('health', 'career', 'personal', 'financial', 'other') NOT NULL,
  `milestones` JSON NULL DEFAULT '[]',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stress Management table
CREATE TABLE IF NOT EXISTS `stress_management` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `date` DATETIME NOT NULL,
  `stressLevel` INT NOT NULL,
  `triggers` JSON NULL DEFAULT '[]',
  `copingStrategies` JSON NULL DEFAULT '[]',
  `notes` TEXT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CHECK (`stressLevel` >= 1 AND `stressLevel` <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social Events table
CREATE TABLE IF NOT EXISTS `social_events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `date` DATETIME NOT NULL,
  `type` ENUM('birthday', 'anniversary', 'meeting', 'party', 'other') DEFAULT 'other',
  `attendees` JSON NULL DEFAULT '[]',
  `location` VARCHAR(255) NULL,
  `reminder` DATETIME NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Suggestions table
CREATE TABLE IF NOT EXISTS `activity_suggestions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` ENUM('outdoor', 'indoor', 'cultural', 'sport', 'relaxation') NOT NULL,
  `estimatedCost` DECIMAL(10,2) NULL,
  `estimatedDuration` INT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

