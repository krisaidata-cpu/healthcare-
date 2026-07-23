-- ============================================================================
-- SOUTH ASIAN METABOLIC HEALTH PLATFORM (MASLD & T2D PREVENTIVE SYSTEM)
-- PostgreSQL Initialization & Schema Definition
-- Compatible with Neon DB Cloud PostgreSQL
-- ============================================================================

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Enums for Regional Cuisines and Meal Types
DO $$ BEGIN
    CREATE TYPE regional_cuisine_enum AS ENUM ('North', 'South', 'East', 'West', 'Generic');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE meal_type_enum AS ENUM ('Breakfast', 'Lunch', 'Dinner', 'Snack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 1. Users Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL CHECK (age > 0 AND age < 120),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    height_cm NUMERIC(5, 2) NOT NULL CHECK (height_cm > 50 AND height_cm < 250),
    baseline_weight_kg NUMERIC(5, 2) NOT NULL CHECK (baseline_weight_kg > 20 AND baseline_weight_kg < 300),
    target_weight_kg NUMERIC(5, 2) DEFAULT 68.0 CHECK (target_weight_kg > 20 AND target_weight_kg < 300),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. Medical History Table (One-to-One with Users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_history_diabetes BOOLEAN NOT NULL DEFAULT FALSE,
    known_masld BOOLEAN NOT NULL DEFAULT FALSE,
    fasting_blood_sugar_mg_dl NUMERIC(6, 2) CHECK (fasting_blood_sugar_mg_dl >= 40 AND fasting_blood_sugar_mg_dl <= 500),
    hba1c_percentage NUMERIC(4, 2) CHECK (hba1c_percentage >= 3.0 AND hba1c_percentage <= 20.0),
    waist_circumference_cm NUMERIC(5, 2) NOT NULL CHECK (waist_circumference_cm > 30 AND waist_circumference_cm < 250),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. Indian Food Database Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS indian_food_database (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(255) NOT NULL,
    regional_cuisine regional_cuisine_enum NOT NULL DEFAULT 'Generic',
    base_measure VARCHAR(100) NOT NULL, -- e.g., '1 katori', '1 piece', '1 ladle'
    calories NUMERIC(6, 2) NOT NULL CHECK (calories >= 0),
    carbs_g NUMERIC(6, 2) NOT NULL CHECK (carbs_g >= 0),
    proteins_g NUMERIC(6, 2) NOT NULL CHECK (proteins_g >= 0),
    fats_g NUMERIC(6, 2) NOT NULL CHECK (fats_g >= 0),
    hidden_fats_g NUMERIC(6, 2) DEFAULT 0 CHECK (hidden_fats_g >= 0), -- Ghee, Dalda, Vanaspati
    glycemic_index_estimate INT CHECK (glycemic_index_estimate BETWEEN 0 AND 100),
    is_deep_fried BOOLEAN DEFAULT FALSE,
    contains_maida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. Daily Logs Table (One-to-Many with Users and IndianFoodDatabase)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    food_item_id UUID NOT NULL REFERENCES indian_food_database(id) ON DELETE RESTRICT,
    quantity_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.0 CHECK (quantity_multiplier > 0),
    meal_type meal_type_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Indexes for High Performance Queries
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_medical_history_user_id ON medical_history(user_id);
CREATE INDEX IF NOT EXISTS idx_food_item_name ON indian_food_database USING gin(to_tsvector('english', item_name));
CREATE INDEX IF NOT EXISTS idx_food_regional_cuisine ON indian_food_database(regional_cuisine);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date);

-- ----------------------------------------------------------------------------
-- Seed Data: Authentic Indian Food Items with Household Portion Measures
-- ----------------------------------------------------------------------------
INSERT INTO indian_food_database (item_name, regional_cuisine, base_measure, calories, carbs_g, proteins_g, fats_g, hidden_fats_g, glycemic_index_estimate, is_deep_fried, contains_maida)
VALUES
    ('Roti / Phulka (Ghee applied)', 'North', '1 piece', 105, 18.0, 3.2, 3.5, 2.0, 62, false, false),
    ('Paneer Butter Masala', 'North', '1 katori (150ml)', 290, 10.0, 9.5, 24.0, 12.0, 45, false, false),
    ('Dal Tadka (Ghee tempered)', 'North', '1 katori (150ml)', 175, 22.0, 9.0, 6.0, 4.0, 50, false, false),
    ('Samosa (Potato filled)', 'North', '1 piece (80g)', 260, 32.0, 4.5, 13.0, 8.0, 75, true, true),
    ('Chole Bhature (1 Bhatura + Chole)', 'North', '1 serving', 480, 58.0, 11.0, 22.0, 14.0, 82, true, true),
    ('Masala Dosa with Coconut Chutney', 'South', '1 medium Dosa', 350, 48.0, 6.5, 14.0, 7.0, 78, false, false),
    ('Idli with Sambar', 'South', '2 pieces', 160, 32.0, 5.0, 1.2, 0.5, 68, false, false),
    ('Medu Vada', 'South', '2 pieces', 280, 28.0, 6.0, 16.0, 10.0, 72, true, false),
    ('Curd Rice (Thayir Sadam)', 'South', '1 katori (150ml)', 210, 34.0, 5.2, 6.0, 2.5, 60, false, false),
    ('Fish Curry (Machher Jhol)', 'East', '1 katori (1 piece fish)', 220, 6.0, 22.0, 12.0, 4.0, 35, false, false),
    ('Luchi with Alur Dom', 'East', '2 Luchis + Sabzi', 380, 46.0, 6.0, 19.0, 11.0, 80, true, true),
    ('Mishti Doi', 'East', '1 katori (100g)', 180, 28.0, 4.2, 5.5, 2.0, 70, false, false),
    ('Pav Bhaji (Butter topped)', 'West', '2 Pavs + Bhaji', 420, 56.0, 8.5, 18.0, 10.0, 76, false, true),
    ('Dhokla (Steamed)', 'West', '2 pieces', 140, 22.0, 5.0, 3.5, 1.0, 52, false, false),
    ('Poha (Peanut & Curry Leaf)', 'West', '1 katori (150g)', 220, 36.0, 4.5, 6.5, 2.0, 64, false, false),
    ('Vada Pav', 'West', '1 piece', 290, 38.0, 5.5, 13.5, 7.0, 79, true, true),
    ('Steamed White Rice', 'Generic', '1 katori (150g)', 195, 43.0, 3.8, 0.5, 0.0, 73, false, false),
    ('Brown Rice', 'Generic', '1 katori (150g)', 160, 34.0, 4.0, 1.2, 0.0, 55, false, false),
    ('Palak Paneer', 'North', '1 katori (150ml)', 230, 8.0, 11.0, 17.0, 8.0, 38, false, false),
    ('Gulab Jamun', 'Generic', '2 pieces', 300, 48.0, 3.0, 11.0, 6.0, 85, true, true)
ON CONFLICT DO NOTHING;
