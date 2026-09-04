-- ============================================================
-- BusinessMind AI — Complete MySQL Database Schema
-- Database Name: businessmind_db
-- ============================================================

CREATE DATABASE IF NOT EXISTS businessmind_db;
USE businessmind_db;

-- 1. Users Table (Authentication & RBAC Roles)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Owner', 'Admin', 'Manager', 'Sales Person', 'Accountant', 'Employee') NOT NULL DEFAULT 'Employee',
    organization_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry_type VARCHAR(100) DEFAULT 'General',
    business_size VARCHAR(50) DEFAULT '1-10',
    owner_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
    
);

-- 3. Sales & Revenue Table (Structured Business Aggregate)
CREATE TABLE IF NOT EXISTS sales_records (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36),
    transaction_date DATE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    revenue DECIMAL(12,2) NOT NULL,
    cost DECIMAL(12,2) NOT NULL,
    profit DECIMAL(12,2) GENERATED ALWAYS AS (revenue - cost) STORED,
    customer_region VARCHAR(100) DEFAULT 'Domestic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Uploaded Datasets Log (CSV / Excel Ingestion Pipeline)
CREATE TABLE IF NOT EXISTS uploaded_datasets (
    id VARCHAR(36) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    indexed_in_rag BOOLEAN DEFAULT TRUE,
    uploaded_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. AI Chat Audit & LLM History
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    question TEXT NOT NULL,
    router_category VARCHAR(20) NOT NULL,
    direct_answer TEXT,
    risk_level VARCHAR(20),
    rag_sources_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-seed Initial Sample Sales Data for Instant Dashboard BI
INSERT INTO sales_records (id, transaction_date, product_name, category, quantity, unit_price, revenue, cost, customer_region)
VALUES 
(UUID(), '2025-07-01', 'Enterprise Cloud License', 'Software', 10, 150000.00, 1500000.00, 950000.00, 'North America'),
(UUID(), '2025-07-15', 'Retail POS Terminal Unit', 'Hardware', 25, 45000.00, 1125000.00, 800000.00, 'APAC'),
(UUID(), '2025-08-01', 'B2B Consulting Package', 'Services', 5, 200000.00, 1000000.00, 600000.00, 'EMEA'),
(UUID(), '2025-08-20', 'SaaS Annual Subscription', 'Software', 40, 30000.00, 1200000.00, 750000.00, 'Domestic')
ON DUPLICATE KEY UPDATE product_name=product_name;
