# 🌿 AyurMetabolic — South Asian Metabolic Health & MASLD Management Platform

> A clinical-grade, full-stack metabolic health management platform tailored specifically for **South Asian genetic phenotypes**, addressing Non-Alcoholic Fatty Liver Disease (**MASLD / NAFLD**) and Type-2 Diabetes driven by high visceral adiposity at lower BMI thresholds.

---

## 📌 Table of Contents
1. [Medical Rationale & Clinical Context](#-medical-rationale--clinical-context)
2. [South Asian Diagnostic Thresholds](#-south-asian-diagnostic-thresholds)
3. [Key Platform Features](#-key-platform-features)
4. [Technology Stack](#-technology-stack)
5. [Database Architecture & Schema](#-database-architecture--schema)
6. [RESTful API Endpoint Documentation](#-restful-api-endpoint-documentation)
7. [Model Context Protocol (MCP) Integration](#-model-context-protocol-mcp-integration)
8. [Installation & Getting Started](#-installation--getting-started)
9. [Docker Deployment](#-docker-deployment)
10. [Automated Verification Tests](#-automated-verification-tests)

---

## 🩺 Medical Rationale & Clinical Context

South Asian populations (India, Pakistan, Bangladesh, Sri Lanka, Nepal) exhibit a unique metabolic phenotype characterized by **thin-fat syndrome** — a tendency to store excess body fat abdominally as intra-visceral and hepatic organ fat, even at a deceptively normal body weight.

Standard Western BMI cutoffs ($25.0\text{ kg/m}^2$ for overweight, $30.0\text{ kg/m}^2$ for obesity) underdiagnose metabolic syndrome in South Asians. Consequently, clinical guidelines from the **Indian Council of Medical Research (ICMR)** and the **World Health Organization (WHO)** mandate lowered diagnostic cutoffs to trigger early preventive action.

---

## 📏 South Asian Diagnostic Thresholds

### 1. South Asian Adjusted BMI Scale
| BMI Category | BMI Range ($\text{kg/m}^2$) | Clinical Trigger & Guidance |
| :--- | :--- | :--- |
| **Underweight** | $< 18.5$ | Monitor lean muscle mass and micronutrient deficiencies. |
| **Normal** | $18.5 – 22.9$ | Optimal metabolic range for South Asian populations. |
| **Overweight** ⚠️ | $\mathbf{23.0 – 24.9}$ | **Action Trigger**: Initiate visceral fat warnings & carbohydrate reduction. |
| **Obese** 🚨 | $\ge 25.0$ | **High Risk**: Elevated probability for MASLD, hepatic steatosis, & T2D. |

### 2. Waist Circumference Cutoffs (Central Obesity)
- **Male**: $> 90\text{ cm}$ (Action trigger for abdominal visceral fat accumulation)
- **Female**: $> 80\text{ cm}$ (Action trigger for abdominal visceral fat accumulation)

---

## ✨ Key Platform Features

### 1. 🎚️ Live Interactive Target Weight & Calorie Deficit Tracker
- **Live Range Slider**: Drag the interactive target weight slider ($45.0\text{ kg} - 100.0\text{ kg}$) to recalculate target weight loss delta, target BMI, daily calorie budget ($-400\text{ kcal/day}$ South Asian deficit), carbohydrate ceiling limit ($170-180\text{g/day}$), and estimated completion timeline in real time.

### 2. 🫀 Anatomical Human Body Fat Distribution Map (SVG)
- **Interactive Body Silhouette**: Visualizes abdominal/visceral core organ fat around liver and pancreas vs. subcutaneous fat layers.
- **Dynamic Glow Core**: Pulsing SVG glow that shifts color (Emerald $\rightarrow$ Amber $\rightarrow$ Crimson) based on visceral fat rating ($1 - 20$ scale).
- **Calculated Metrics**: Total Body Fat %, Visceral Organ Fat mass in kg, Subcutaneous Fat mass in kg, and VAT/SAT ratio.

### 3. 🎯 Visceral Fat & MASLD Risk Gauge Meter
- **Dynamic Gauge SVG**: Animated semi-circular meter with rotating pointer needle indicating Visceral Fat Risk Score ($0 - 100$) and MASLD Probability %.

### 4. 🍱 Indian Regional Diet Logger (Household Portions)
- **Vernacular Auto-Suggest Search**: Search North, South, East, West, and Generic Indian foods.
- **Household Measures**: Standardized to katori/bowl, ladle, and piece rather than grams.
- **Nuanced Macro Tracking**: Tracks Carbohydrate load, Protein, Fats, Hidden Fats (Ghee, Vanaspati/Dalda), Refined flours (Maida), and Glycemic Index (GI).

### 5. 🏃 Exercise Protocols with Visual Video Demonstrations
- **Embedded Movement Video Player**: Interactive HTML5 video player inside the Exercise Modal showcasing movement technique.
- **Video Controls Toolbar**: Play/Pause toggle (▶ / ⏸), Speed selector ($1.0\text{x} / 1.5\text{x} / 2.0\text{x}$), and Loop toggle.
- **Targeted Protocols**:
  - *High-Intensity Interval Training (HIIT)*
  - *Post-Meal Brisk Walk ("Shatapavali")* within 15 mins after meal completion
  - *Skeletal Muscle Glucose Sink Resistance Circuit*

### 6. 🔥 Metabolic Streak & Hydration Tracker
- **7-Day Consistency Streak Badge** 🔥.
- **Post-Meal Steps Counter** 🚶‍♂️.
- **Interactive Water Quick-Add Button** 💧 (+250ml per click).

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | HTML5, Vanilla CSS3 (Glassmorphism 2.0), JavaScript (ES6+), Dynamic SVG Graphics |
| **Backend API** | Node.js, Express.js RESTful API Architecture |
| **Database** | Cloud PostgreSQL (**Neon DB Pooler**) with native UUIDs, Enums, and Triggers |
| **Integration** | Model Context Protocol (**MCP**) compatible AI endpoint |
| **Containerization** | Docker, Docker Compose |

---

## 🗄️ Database Architecture & Schema

The application is backed by PostgreSQL (Neon DB Cloud) with strict relational constraints:

```
                  +-------------------+
                  |       users       |
                  +-------------------+
                  | id (UUID, PK)     |
                  | name              |
                  | age, gender       |
                  | height_cm         |
                  | baseline_weight_kg|
                  | target_weight_kg  |
                  +---------+---------+
                            | 1:1
                            v
                  +-------------------+
                  |  medical_history  |
                  +-------------------+
                  | user_id (FK, UNQ) |
                  | family_history_t2d|
                  | known_masld       |
                  | fasting_sugar     |
                  | hba1c_percentage  |
                  | waist_cm          |
                  +-------------------+

                            | 1:N
                            v
                  +-------------------+       N:1       +-----------------------+
                  |    daily_logs     | +-------------> | indian_food_database  |
                  +-------------------+                 +-----------------------+
                  | id (UUID, PK)     |                 | id (UUID, PK)         |
                  | user_id (FK)      |                 | item_name             |
                  | food_item_id (FK) |                 | regional_cuisine      |
                  | quantity_mult     |                 | base_measure          |
                  | meal_type         |                 | calories, carbs, prot |
                  | log_date          |                 | fats, hidden_fats_g   |
                  +-------------------+                 +-----------------------+
```

---

## 📡 RESTful API Endpoint Documentation

Base URL: `/api/v1`

### 1. User & Metabolic Profile
- `POST /api/v1/users/register`: Registers a user profile, initializes medical baseline, and returns South Asian BMI & risk scores.
- `GET /api/v1/users/:id/health-risk`: Returns South Asian BMI, Visceral Fat Score, Body Fat %, MASLD Probability %, and Exercise Prescriptions.

### 2. Daily Diet Logs
- `POST /api/v1/logs/diet`: Creates a new meal log entry with household portion multipliers.
- `GET /api/v1/logs/diet/:userId`: Returns logged meals for the day and aggregated macro totals (Calories, Carbs, Protein, Fats, Hidden Fats).
- `DELETE /api/v1/logs/diet/:logId`: Deletes a specific diet log entry.

### 3. Indian Food Database
- `GET /api/v1/food/search?query={term}&cuisine={North|South|East|West}`: Searches the Indian food database with auto-suggest.

### 4. Model Context Protocol (MCP) AI Evaluation
- `POST /api/v1/mcp/analyze-diet`: Evaluates meal logs and returns clinical recommendations tuned for South Asian genetics.

---

## 🤖 Model Context Protocol (MCP) Integration

The platform provides a standardized MCP endpoint (`/api/v1/mcp/analyze-diet`) enabling external AI agents (e.g. Antigravity Agentic AI) to programmatically analyze user meal logs and trigger clinical interventions:

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

## 🚀 Installation & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ 
- [PostgreSQL](https://www.postgresql.org/) or [Neon DB Cloud Account](https://neon.tech/)

### Step 1: Clone Repository
```bash
git clone https://github.com/krisaidata-cpu/healthcare-.git
cd healthcare-
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://neondb_owner:npg_1WNdOR2Sofpe@ep-long-mode-azk0l9vn-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### Step 4: Initialize & Seed Database Schema
```bash
npm run init-db
```

### Step 5: Start Development Server
```bash
npm start
```
Open your browser at `http://localhost:3000`.

---

## 🐳 Docker Deployment

You can build and run the entire application using Docker:

```bash
# Build Docker image
docker build -t south-asian-metabolic-health .

# Run Docker container
docker run -p 3000:3000 -e DATABASE_URL="postgresql://neondb_owner:npg_1WNdOR2Sofpe@ep-long-mode-azk0l9vn-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" south-asian-metabolic-health
```

Alternatively, launch using Docker Compose:
```bash
docker-compose up --build
```

---

## 🧪 Automated Verification Tests

Run the built-in test suite to verify server health, database connectivity, risk score calculations, and REST API endpoints:

```bash
node test/verify_app.js
```

---

## 📄 License
This project is released under the [MIT License](LICENSE).
