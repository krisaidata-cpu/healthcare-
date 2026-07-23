/**
 * ============================================================================
 * DATABASE CONFIGURATION MODULE - NEON DB (POSTGRESQL) & MOCK FALLBACK
 * ============================================================================
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
let pool = null;
let isConnectedToNeon = false;

// Fallback In-Memory Datastore for instant preview when DATABASE_URL is unconfigured
const inMemoryDb = {
  users: [],
  medical_history: [],
  indian_food_database: [
    { id: '11111111-1111-1111-1111-111111111111', item_name: 'Roti / Phulka (Ghee applied)', regional_cuisine: 'North', base_measure: '1 piece', calories: 105, carbs_g: 18.0, proteins_g: 3.2, fats_g: 3.5, hidden_fats_g: 2.0, glycemic_index_estimate: 62, is_deep_fried: false, contains_maida: false },
    { id: '22222222-2222-2222-2222-222222222222', item_name: 'Paneer Butter Masala', regional_cuisine: 'North', base_measure: '1 katori (150ml)', calories: 290, carbs_g: 10.0, proteins_g: 9.5, fats_g: 24.0, hidden_fats_g: 12.0, glycemic_index_estimate: 45, is_deep_fried: false, contains_maida: false },
    { id: '33333333-3333-3333-3333-333333333333', item_name: 'Dal Tadka (Ghee tempered)', regional_cuisine: 'North', base_measure: '1 katori (150ml)', calories: 175, carbs_g: 22.0, proteins_g: 9.0, fats_g: 6.0, hidden_fats_g: 4.0, glycemic_index_estimate: 50, is_deep_fried: false, contains_maida: false },
    { id: '44444444-4444-4444-4444-444444444444', item_name: 'Samosa (Potato filled)', regional_cuisine: 'North', base_measure: '1 piece (80g)', calories: 260, carbs_g: 32.0, proteins_g: 4.5, fats_g: 13.0, hidden_fats_g: 8.0, glycemic_index_estimate: 75, is_deep_fried: true, contains_maida: true },
    { id: '55555555-5555-5555-5555-555555555555', item_name: 'Masala Dosa with Coconut Chutney', regional_cuisine: 'South', base_measure: '1 medium Dosa', calories: 350, carbs_g: 48.0, proteins_g: 6.5, fats_g: 14.0, hidden_fats_g: 7.0, glycemic_index_estimate: 78, is_deep_fried: false, contains_maida: false },
    { id: '66666666-6666-6666-6666-666666666666', item_name: 'Idli with Sambar', regional_cuisine: 'South', base_measure: '2 pieces', calories: 160, carbs_g: 32.0, proteins_g: 5.0, fats_g: 1.2, hidden_fats_g: 0.5, glycemic_index_estimate: 68, is_deep_fried: false, contains_maida: false },
    { id: '77777777-7777-7777-7777-777777777777', item_name: 'Poha (Peanut & Curry Leaf)', regional_cuisine: 'West', base_measure: '1 katori (150g)', calories: 220, carbs_g: 36.0, proteins_g: 4.5, fats_g: 6.5, hidden_fats_g: 2.0, glycemic_index_estimate: 64, is_deep_fried: false, contains_maida: false },
    { id: '88888888-8888-8888-8888-888888888888', item_name: 'Steamed White Rice', regional_cuisine: 'Generic', base_measure: '1 katori (150g)', calories: 195, carbs_g: 43.0, proteins_g: 3.8, fats_g: 0.5, hidden_fats_g: 0.0, glycemic_index_estimate: 73, is_deep_fried: false, contains_maida: false }
  ],
  daily_logs: []
};

// Seed default user into in-memory DB
const defaultUserId = 'a0000000-0000-0000-0000-000000000001';
inMemoryDb.users.push({
  id: defaultUserId,
  name: 'Rajesh Kumar',
  age: 42,
  gender: 'Male',
  height_cm: 172.0,
  baseline_weight_kg: 78.5,
  created_at: new Date()
});

inMemoryDb.medical_history.push({
  id: uuidv4(),
  user_id: defaultUserId,
  family_history_diabetes: true,
  known_masld: false,
  fasting_blood_sugar_mg_dl: 112.0,
  hba1c_percentage: 6.1,
  waist_circumference_cm: 94.0,
  updated_at: new Date()
});

if (connectionString && connectionString.trim() !== '') {
  try {
    pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false // Neon DB Cloud SSL configuration
      }
    });

    pool.on('error', (err) => {
      console.error('Unexpected Neon DB PostgreSQL Pool Error:', err);
    });

    isConnectedToNeon = true;
    console.log('Connected to Neon DB Cloud PostgreSQL instance.');
  } catch (err) {
    console.warn('Could not initialize Neon DB pool. Falling back to local/in-memory mode:', err.message);
  }
} else {
  console.log('No DATABASE_URL set. Running in Zero-Config Demo Mode (In-Memory Datastore). Set DATABASE_URL in .env to connect to Neon DB.');
}

/**
 * Initializes Database Tables on Neon DB PostgreSQL if connected
 */
async function initializeNeonDatabase() {
  if (!pool || !isConnectedToNeon) return;

  try {
    const initSqlPath = path.join(__dirname, '..', 'database', 'init.sql');
    if (fs.existsSync(initSqlPath)) {
      const sqlContent = fs.readFileSync(initSqlPath, 'utf8');
      await pool.query(sqlContent);
      console.log('Successfully applied PostgreSQL initialization schema to Neon DB.');
    }
  } catch (error) {
    console.error('Error applying schema to Neon DB:', error.message);
  }
}

/**
 * Unified Query interface supporting both Neon PostgreSQL and In-Memory fallback
 */
async function query(text, params = []) {
  if (pool && isConnectedToNeon) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (err) {
      console.warn('Neon DB query failed, using in-memory handling:', err.message);
    }
  }

  // Handle queries using in-memory fallback
  return handleInMemoryQuery(text, params);
}

function handleInMemoryQuery(text, params) {
  const normalizedSql = text.trim().toLowerCase();

  // Search Food
  if (normalizedSql.includes('from indian_food_database')) {
    let results = [...inMemoryDb.indian_food_database];
    if (params.length > 0 && params[0]) {
      const term = String(params[0]).replace(/%/g, '').toLowerCase();
      results = results.filter(f => f.item_name.toLowerCase().includes(term) || f.regional_cuisine.toLowerCase().includes(term));
    }
    return { rows: results, rowCount: results.length };
  }

  // Get User Profile with Medical History
  if (normalizedSql.includes('from users u') && normalizedSql.includes('medical_history')) {
    const userId = params[0];
    const user = inMemoryDb.users.find(u => u.id === userId) || inMemoryDb.users[0];
    const med = inMemoryDb.medical_history.find(m => m.user_id === user.id) || inMemoryDb.medical_history[0];
    if (!user) return { rows: [], rowCount: 0 };
    return {
      rows: [{
        ...user,
        family_history_diabetes: med.family_history_diabetes,
        known_masld: med.known_masld,
        fasting_blood_sugar_mg_dl: med.fasting_blood_sugar_mg_dl,
        hba1c_percentage: med.hba1c_percentage,
        waist_circumference_cm: med.waist_circumference_cm
      }],
      rowCount: 1
    };
  }

  // Register User
  if (normalizedSql.includes('insert into users')) {
    const id = params[0] || uuidv4();
    const newUser = {
      id,
      name: params[1],
      age: params[2],
      gender: params[3],
      height_cm: params[4],
      baseline_weight_kg: params[5],
      created_at: new Date()
    };
    inMemoryDb.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }

  // Insert Medical History
  if (normalizedSql.includes('insert into medical_history')) {
    const newMed = {
      id: uuidv4(),
      user_id: params[0],
      family_history_diabetes: params[1],
      known_masld: params[2],
      fasting_blood_sugar_mg_dl: params[3],
      hba1c_percentage: params[4],
      waist_circumference_cm: params[5],
      updated_at: new Date()
    };
    inMemoryDb.medical_history.push(newMed);
    return { rows: [newMed], rowCount: 1 };
  }

  // Log Diet
  if (normalizedSql.includes('insert into daily_logs')) {
    const newLog = {
      id: uuidv4(),
      user_id: params[0],
      food_item_id: params[1],
      quantity_multiplier: params[2],
      meal_type: params[3],
      log_date: new Date().toISOString().split('T')[0],
      created_at: new Date()
    };
    inMemoryDb.daily_logs.push(newLog);
    return { rows: [newLog], rowCount: 1 };
  }

  // Fetch Daily Logs with Food Details
  if (normalizedSql.includes('from daily_logs l')) {
    const userId = params[0];
    const logs = inMemoryDb.daily_logs.filter(l => l.user_id === userId);
    const enriched = logs.map(l => {
      const food = inMemoryDb.indian_food_database.find(f => f.id === l.food_item_id) || {};
      return {
        ...l,
        item_name: food.item_name || 'Custom Meal',
        base_measure: food.base_measure || '1 serving',
        calories: (food.calories || 0) * l.quantity_multiplier,
        carbs_g: (food.carbs_g || 0) * l.quantity_multiplier,
        proteins_g: (food.proteins_g || 0) * l.quantity_multiplier,
        fats_g: (food.fats_g || 0) * l.quantity_multiplier,
        hidden_fats_g: (food.hidden_fats_g || 0) * l.quantity_multiplier,
        is_deep_fried: food.is_deep_fried,
        contains_maida: food.contains_maida
      };
    });
    return { rows: enriched, rowCount: enriched.length };
  }

  return { rows: [], rowCount: 0 };
}

module.exports = {
  query,
  pool,
  isConnectedToNeon,
  initializeNeonDatabase
};
