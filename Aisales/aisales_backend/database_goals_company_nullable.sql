-- Database migration script to make company field nullable in goals table
-- This ensures that goals can be created without requiring a company field

-- Check if the goals table exists and get current column definition
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'goals'
AND COLUMN_NAME = 'company';

-- Make company field nullable (if it's not already)
ALTER TABLE goals 
MODIFY COLUMN company VARCHAR(255) NULL;

-- Verify the change
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'goals'
AND COLUMN_NAME = 'company';

