-- ============================================================
-- Finova — MySQL Schema
-- "Track less. Grow more."
-- ============================================================
-- Run: mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS finova
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE finova;

-- ─── users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'USER',
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── user_profiles (onboarding) ────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id                  BIGINT        AUTO_INCREMENT PRIMARY KEY,
  user_id             BIGINT        NOT NULL UNIQUE,
  monthly_income      DECIMAL(15,2),
  job_type            VARCHAR(20),
  fixed_expenses      DECIMAL(15,2),
  risk_level          VARCHAR(10)   DEFAULT 'MEDIUM',
  goals               VARCHAR(500),
  age                 INT,
  existing_loans      INT           DEFAULT 0,
  is_profile_complete TINYINT(1)    NOT NULL DEFAULT 0,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── transactions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id          BIGINT         AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT         NOT NULL,
  type        VARCHAR(10)    NOT NULL,        -- INCOME or EXPENSE
  amount      DECIMAL(15,2)  NOT NULL,
  category    VARCHAR(50)    NOT NULL,
  description VARCHAR(200),
  date        DATE           NOT NULL,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_txn_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── investments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investments (
  id               BIGINT         AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT         NOT NULL,
  name             VARCHAR(100)   NOT NULL,
  type             VARCHAR(20)    NOT NULL,
  invested_amount  DECIMAL(15,2)  NOT NULL,
  current_value    DECIMAL(15,2),
  monthly_sip      DECIMAL(10,2),
  start_date       DATE,
  created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── loans ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loans (
  id                 BIGINT        AUTO_INCREMENT PRIMARY KEY,
  user_id            BIGINT        NOT NULL,
  name               VARCHAR(100)  NOT NULL,
  type               VARCHAR(20)   NOT NULL,
  principal_amount   DECIMAL(15,2) NOT NULL,
  outstanding_amount DECIMAL(15,2) NOT NULL,
  interest_rate      DECIMAL(5,2)  NOT NULL,
  tenure_months      INT           NOT NULL,
  start_date         DATE,
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_loan_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_txn_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_txn_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_inv_user      ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_user     ON loans(user_id);

-- ============================================================
-- Seed data: ONE demo user, NO fake transactions
-- Password: admin123
-- User will be directed to onboarding after first login.
-- ============================================================
INSERT IGNORE INTO users (username, email, password, role) VALUES
('admin','admin@finova.com','$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBaIW28We2lew.','USER');

SELECT '✓ Finova schema ready. No fake data.' AS status;
SELECT COUNT(*) AS users FROM users;

-- ============================================================
-- v2 ADDITIONS — Investment options, User investments, Insurance
-- ============================================================

-- ─── investment_options (market catalog) ───────────────────
CREATE TABLE IF NOT EXISTS investment_options (
  id              BIGINT         AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)   NOT NULL,
  category        VARCHAR(30)    NOT NULL,   -- LARGE_CAP, MID_CAP, SMALL_CAP, GOLD, SILVER, MUTUAL_FUND
  symbol          VARCHAR(30),
  current_price   DECIMAL(12,4)  NOT NULL,
  prev_price      DECIMAL(12,4),
  one_year_return DECIMAL(5,2),
  risk_level      VARCHAR(10),               -- LOW, MEDIUM, HIGH
  description     VARCHAR(300),
  fund_house      VARCHAR(100),
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── user_investments (user positions) ─────────────────────
CREATE TABLE IF NOT EXISTS user_investments (
  id                 BIGINT         AUTO_INCREMENT PRIMARY KEY,
  user_id            BIGINT         NOT NULL,
  market_option_id   BIGINT         NOT NULL,
  invested_amount    DECIMAL(15,2)  NOT NULL,
  buy_price          DECIMAL(12,4)  NOT NULL,
  units              DECIMAL(12,4)  NOT NULL,
  monthly_sip        DECIMAL(10,2),
  purchase_date      DATE,
  created_at         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ui_user   FOREIGN KEY (user_id)          REFERENCES users(id)               ON DELETE CASCADE,
  CONSTRAINT fk_ui_option FOREIGN KEY (market_option_id) REFERENCES investment_options(id)  ON DELETE CASCADE
);

-- ─── insurance_plans (seeded by DataSeeder) ────────────────
CREATE TABLE IF NOT EXISTS insurance_plans (
  id               BIGINT         AUTO_INCREMENT PRIMARY KEY,
  type             VARCHAR(20)    NOT NULL,  -- LIFE, HEALTH, VEHICLE
  company          VARCHAR(100)   NOT NULL,
  name             VARCHAR(150)   NOT NULL,
  annual_premium   DECIMAL(12,2),
  coverage_amount  DECIMAL(15,2),
  claim_ratio      DECIMAL(5,2),
  benefits         VARCHAR(500),
  limitations      VARCHAR(500),
  min_age          INT,
  max_age          INT,
  min_income       DECIMAL(12,2),
  tier             VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_ui_user   ON user_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_io_cat    ON investment_options(category);
CREATE INDEX IF NOT EXISTS idx_io_risk   ON investment_options(risk_level);
CREATE INDEX IF NOT EXISTS idx_ins_type  ON insurance_plans(type);

SELECT '✓ v2 tables created.' AS status;
