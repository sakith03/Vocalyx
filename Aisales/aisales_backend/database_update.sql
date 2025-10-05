-- Update users table to add custom_role_id column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS custom_role_id BIGINT,
ADD CONSTRAINT fk_users_custom_role 
    FOREIGN KEY (custom_role_id) REFERENCES custom_roles(id) 
    ON DELETE SET NULL;

-- Create custom_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS custom_roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(255) NOT NULL,
    description TEXT,
    company_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Create role_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_name VARCHAR(255) NOT NULL,
    has_access BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES custom_roles(id) ON DELETE CASCADE
);

-- Update the role column to be nullable (since we now have custom roles)
ALTER TABLE users 
MODIFY COLUMN role ENUM('USER', 'ADMIN') NOT NULL;
