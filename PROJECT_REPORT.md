# 📊 AYURMETABOLIC: DETAILED TECHNICAL & CLINICAL PROJECT REPORT
## Precision South Asian Metabolic Health, MASLD Risk & T2D Care Platform

**Document Version:** 2.0 (Master Detailed Technical Specification)  
**Author:** Antigravity Full-Stack Health-Tech Architect Team  
**Database Infrastructure:** Neon DB Cloud PostgreSQL  
**Frontend System:** Anti Gravity Glassmorphism 2.0 System  
**Protocol Standard:** Model Context Protocol (MCP) 1.0  
**GitHub Repository:** [https://github.com/krisaidata-cpu/healthcare-](https://github.com/krisaidata-cpu/healthcare-)  

---

## 📖 Table of Contents
1. [Executive Summary & Clinical Rationale](#1-executive-summary--clinical-rationale)
2. [Clinical Medical & Mathematical Models](#2-clinical-medical--mathematical-models)
3. [System Architecture & System Sequence Flow](#3-system-architecture--system-sequence-flow)
4. [Complete PostgreSQL Database Schema & DDL](#4-complete-postgresql-database-schema--ddl)
5. [RESTful API Architecture & Payload Reference](#5-restful-api-architecture--payload-reference)
6. [Model Context Protocol (MCP) AI Integration](#6-model-context-protocol-mcp-ai-integration)
7. [Frontend UI/UX Systems & Interactive Modules](#7-frontend-uiux-systems--interactive-modules)
8. [DevOps, Neon Cloud & Docker Deployment Guide](#8-devops-neon-cloud--docker-deployment-guide)
9. [Empirical Verification Test Logs](#9-empirical-verification-test-logs)

---

## 1. Executive Summary & Clinical Rationale

### 1.1 The South Asian Metabolic Crisis
South Asian populations (comprising individuals of Indian, Pakistani, Bangladeshi, Sri Lankan, and Nepali descent) are currently facing a severe public health crisis marked by early-onset **Type-2 Diabetes Mellitus (T2D)** and **Metabolic Dysfunction-Associated Steatotic Liver Disease (MASLD / NAFLD)**.

Epidemiological research demonstrates that South Asians experience metabolic dysfunction **10 to 15 years earlier** and at significantly lower Body Mass Index (BMI) levels compared to Caucasian populations.

### 1.2 The "Thin-Fat" Phenotype (Visceral Adiposity)
This phenomenon is driven by a unique genetic and body composition profile known as the **Thin-Fat Phenotype**:
- **High Visceral Adipose Tissue (VAT)**: Increased deposition of deep abdominal organ fat surrounding the liver, pancreas, and mesenteric organs.
- **Low Skeletal Muscle Mass (Sarcopenia)**: Decreased peripheral glucose storage capacity (glucose sink).
- **Hepatic De Novo Lipogenesis**: Elevated conversion of high-carbohydrate Indian staple diets (white rice, refined wheat maida, deep-fried snacks) into liver triglycerides.
- **Hidden Saturated Fats**: Frequent consumption of ghee, vanaspati/dalda, and reused cooking oils accelerating hepatic steatosis.

Standard international BMI diagnostic cutoffs ($25.0\text{ kg/m}^2$ for overweight and $30.0\text{ kg/m}^2$ for obesity) severely underestimate metabolic risk in South Asians. The **AyurMetabolic Platform** was built to directly enforce South Asian specific medical algorithms, providing targeted dietary tracking, visceral fat burning exercise protocols, and cloud database persistence.

---

## 2. Clinical Medical & Mathematical Models

### 2.1 South Asian Adjusted BMI Matrix (ICMR / WHO Guidelines)
$$\text{BMI} = \frac{\text{Weight (kg)}}{\left(\text{Height (m)}\right)^2}$$

| BMI Category | BMI Range ($\text{kg/m}^2$) | Metabolic Risk Status | Action Prescribed |
| :--- | :--- | :--- | :--- |
| **Underweight** | $< 18.5$ | Lean Muscle Depletion | Nutritional fortification |
| **Normal** | $18.5 – 22.9$ | Optimal South Asian Baseline | Lifestyle maintenance |
| **Overweight** ⚠️ | $\mathbf{23.0 – 24.9}$ | **Metabolic Warning Triggered** | Initiate Visceral Fat & Carb Deficit |
| **Obese** 🚨 | $\ge 25.0$ | **High MASLD & Diabetes Risk** | Intensive Exercise & Clinical Protocol |

> ⚠️ **Key Clinical Trigger**: South Asian individuals with a BMI $\ge 23.0\text{ kg/m}^2$ trigger immediate visceral fat accumulation warnings.

### 2.2 Waist Circumference Cutoffs (Central Obesity)
- **Male**: $> 90\text{ cm}$
- **Female**: $> 80\text{ cm}$

### 2.3 South Asian Body Fat Percentage Equation
Using the modified Deurenberg anthropometric formula tuned for South Asian body densities:

$$\text{Body Fat \%} = (1.20 \times \text{BMI}) + (0.23 \times \text{Age}) - (10.8 \times \text{Gender}) - 5.4$$
*(where $\text{Gender} = 1$ for Male, $0$ for Female)*

### 2.4 Visceral Fat Rating Scale (1 to 20)
$$\text{WHtR (Waist-to-Height Ratio)} = \frac{\text{Waist Circumference (cm)}}{\text{Height (cm)}}$$

$$\text{Visceral Fat Rating} = \text{Min}\left(20, \text{Max}\left(1, \text{Round}\left(\text{WHtR} \times 22\right)\right)\right)$$
- **Level 1–8**: Healthy visceral organ fat level.
- **Level 9–11**: Elevated abdominal visceral fat.
- **Level 12–20**: Severe visceral accumulation surrounding liver and pancreas (High MASLD risk).

### 2.5 Desired Weight Deficit & Calorie Target Equations
$$\text{BMR}_{\text{Male}} = (10 \times \text{Weight}) + (6.25 \times \text{Height}) - (5 \times \text{Age}) + 5$$
$$\text{BMR}_{\text{Female}} = (10 \times \text{Weight}) + (6.25 \times \text{Height}) - (5 \times \text{Age}) - 161$$

$$\text{Daily Calorie Target (kcal)} = \text{Max}\left(1200, \text{Round}(\text{BMR} \times 1.35) - 400\text{ kcal}\right)$$
$$\text{Carbohydrate Ceiling (g)} = \text{Round}\left(\frac{\text{Daily Calorie Target} \times 0.45}{4}\right)$$
$$\text{Estimated Timeline (Weeks)} = \left\lceil \frac{\text{Baseline Weight} - \text{Target Weight}}{0.65\text{ kg/week}} \right\rceil$$

---

## 3. System Architecture & System Sequence Flow

### 3.1 High-Level Architecture Diagram
```mermaid
graph TD
    Client UI[Anti Gravity Glassmorphism 2.0 Web UI] <--> API[Express.js RESTful Router]
    
    subgraph REST API Server Backend
        API --> UserController[User & Risk Controller]
        API --> LogController[Daily Diet Log Controller]
        API --> FoodController[Indian Food Database Controller]
        API --> MCPController[Model Context Protocol Controller]
        
        UserController --> RiskEngine[South Asian Risk Engine]
        RiskEngine --> MathModule[Medical Diagnostic Formulas]
    end

    subgraph Database Layer
        UserController <--> DB[(Neon DB Cloud PostgreSQL)]
        LogController <--> DB
        FoodController <--> DB
    end

    subgraph AI Agent Integration
        MCPController <--> AI[Antigravity AI Agent / LLM Services]
    end
```

---

## 4. Complete PostgreSQL Database Schema & DDL

The database architecture is built on **Neon DB Cloud PostgreSQL** using UUID primary keys, foreign key cascades, custom enums, and optimized GIN indexes.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Custom Enums
CREATE TYPE regional_cuisine_enum AS ENUM ('North', 'South', 'East', 'West', 'Generic');
CREATE TYPE meal_type_enum AS ENUM ('Breakfast', 'Lunch', 'Dinner', 'Snack');

-- 1. Users Table
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

-- 2. Medical History Table
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

-- 3. Indian Food Database Table
CREATE TABLE IF NOT EXISTS indian_food_database (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(255) NOT NULL,
    regional_cuisine regional_cuisine_enum NOT NULL DEFAULT 'Generic',
    base_measure VARCHAR(100) NOT NULL, -- e.g., '1 katori', '1 piece'
    calories NUMERIC(6, 2) NOT NULL CHECK (calories >= 0),
    carbs_g NUMERIC(6, 2) NOT NULL CHECK (carbs_g >= 0),
    proteins_g NUMERIC(6, 2) NOT NULL CHECK (proteins_g >= 0),
    fats_g NUMERIC(6, 2) NOT NULL CHECK (fats_g >= 0),
    hidden_fats_g NUMERIC(6, 2) DEFAULT 0 CHECK (hidden_fats_g >= 0),
    glycemic_index_estimate INT CHECK (glycemic_index_estimate BETWEEN 0 AND 100),
    is_deep_fried BOOLEAN DEFAULT FALSE,
    contains_maida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Daily Logs Table
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    food_item_id UUID NOT NULL REFERENCES indian_food_database(id) ON DELETE RESTRICT,
    quantity_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.0 CHECK (quantity_multiplier > 0),
    meal_type meal_type_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_medical_history_user_id ON medical_history(user_id);
CREATE INDEX IF NOT EXISTS idx_food_item_name ON indian_food_database USING gin(to_tsvector('english', item_name));
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date);
```

---

## 5. RESTful API Architecture & Payload Reference

Base API Route: `/api/v1`

### 5.1 Register User & Medical Baseline (`POST /api/v1/users/register`)
**Request Payload:**
```json
{
  "name": "Priya Sharma",
  "age": 38,
  "gender": "Female",
  "height_cm": 160.0,
  "baseline_weight_kg": 62.5,
  "target_weight_kg": 54.0,
  "waist_circumference_cm": 84.0,
  "family_history_diabetes": true,
  "known_masld": false,
  "fasting_blood_sugar_mg_dl": 108.0,
  "hba1c_percentage": 5.9
}
```

**Response Payload (`201 Created`):**
```json
{
  "message": "User metabolic profile successfully registered.",
  "user": {
    "id": "c101a000-1111-2222-3333-444455556666",
    "name": "Priya Sharma",
    "age": 38,
    "gender": "Female",
    "height_cm": 160,
    "baseline_weight_kg": 62.5,
    "target_weight_kg": 54
  },
  "riskAssessment": {
    "bmi": 24.41,
    "bmiCategory": "Overweight",
    "southAsianActionTriggered": true,
    "visceralFatScore": 70,
    "masldProbabilityPercentage": 60,
    "estimatedBodyFatPercentage": 31.8,
    "visceralFatLevel": 12,
    "riskLevel": "High"
  }
}
```

### 5.2 Search Indian Food Database (`GET /api/v1/food/search?query=Paneer`)
**Response Payload (`200 OK`):**
```json
{
  "count": 1,
  "query": "Paneer",
  "cuisineFilter": "All",
  "foods": [
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "item_name": "Paneer Butter Masala",
      "regional_cuisine": "North",
      "base_measure": "1 katori (150ml)",
      "calories": 290,
      "carbs_g": 10,
      "proteins_g": 9.5,
      "fats_g": 24,
      "hidden_fats_g": 12,
      "glycemic_index_estimate": 45
    }
  ]
}
```

---

## 6. Model Context Protocol (MCP) AI Integration

The system exposes an MCP-compliant endpoint (`POST /api/v1/mcp/analyze-diet`) enabling autonomous AI agents to evaluate diet logs against South Asian metabolic risk models.

**Sample MCP Payload Response:**
```json
{
  "mcpProtocolVersion": "1.0",
  "agentTool": "south_asian_metabolic_diet_analyzer",
  "status": "success",
  "contextSummary": {
    "userId": "a0000000-0000-0000-0000-000000000001",
    "totalCarbohydratesG": 182,
    "totalProteinsG": 48,
    "totalHiddenFatsG": 18,
    "carbToProteinRatio": 3.79,
    "metabolicRiskTriggersDetected": 2
  },
  "aiRecommendations": [
    {
      "type": "CARB_OVERLOAD_WARNING",
      "severity": "HIGH",
      "message": "High Carbohydrate to Protein Ratio (3.79:1). Excess refined carbs promote hepatic de novo lipogenesis, directly worsening liver fat (MASLD). Recommend replacing 1 katori rice/roti with sprouts, dal, or paneer."
    }
  ]
}
```

---

## 7. Frontend UI/UX Systems & Interactive Modules

### 7.1 Key Interactive UI Modules
1. **Live Draggable Target Weight Slider**: Recalculates Target Weight, Delta Weight, Target BMI, Daily Caloric Target, and Timeline in real time.
2. **Anatomical Human Body Fat Map (SVG)**: Displays abdominal core organ fat vs. subcutaneous fat layers with a pulsing SVG glow.
3. **Dynamic Visceral Fat Gauge Meter**: Animates a pointer needle across Green, Amber, and Crimson risk zones.
4. **Interactive Movement Video Player**: Embedded HTML5 movement guides for HIIT, post-meal walks (*Shatapavali*), and core resistance circuits.
5. **Metabolic Streak & Water Intake Tracker**: 7-Day consistency streak badge and `+250ml` quick-add hydration button.

---

## 8. DevOps, Neon Cloud & Docker Deployment Guide

### 8.1 Environment Configuration (`.env`)
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_1WNdOR2Sofpe@ep-long-mode-azk0l9vn-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### 8.2 Database Seeding Command
```bash
npm run init-db
```

### 8.3 Docker Deployment
```bash
# Build container image
docker build -t south-asian-metabolic-app .

# Run container
docker run -p 3000:3000 -e DATABASE_URL="postgresql://neondb_owner:npg_1WNdOR2Sofpe@ep-long-mode-azk0l9vn-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" south-asian-metabolic-app
```

---

## 9. Empirical Verification Test Logs

Executed automated verification test script (`test/verify_app.js`):

```
=== STARTING API ENDPOINT VERIFICATION ===
✔ Health Check Response: 200 {
  status: 'online',
  system: 'South Asian Metabolic Health Platform',
  neonDbConnected: true,
  timestamp: '2026-07-23T03:06:04.872Z'
}
✔ User Registration Status: 201
  South Asian BMI: 24.41 Category: Overweight (Triggered: true)
✔ User Health Risk Status: 200 Visceral Fat Score: 70
✔ Food Search Count for "Paneer": 6 items returned
✔ Diet Log Created: 201 43765b23-7c88-4996-984f-dd0611fe0df8
✔ Daily Logs Summary: { calories: 345, carbsG: 12, proteinsG: 16.5, fatsG: 25.5, hiddenFatsG: 12 }
✔ MCP AI Evaluation Status: 200

=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===
```

---

## 📜 Conclusion & Sign-Off

The **AyurMetabolic Platform** provides an end-to-end clinical solution targeting the South Asian metabolic phenotype. Backed by cloud PostgreSQL (Neon DB), mathematical diagnostic algorithms, dynamic SVG body fat mapping, visual exercise movement guides, and Model Context Protocol AI capabilities, the codebase is fully verified and ready for production deployment.
