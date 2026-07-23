/**
 * ============================================================================
 * USER & METABOLIC HEALTH RISK CONTROLLER
 * ============================================================================
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { calculateComprehensiveMetabolicRisk } = require('../utils/riskCalculator');

/**
 * Register User and Initialize Baseline Medical Parameters
 * POST /api/v1/users/register
 */
async function registerUser(req, res) {
  try {
    const {
      name,
      age,
      gender,
      height_cm,
      baseline_weight_kg,
      target_weight_kg,
      family_history_diabetes,
      known_masld,
      fasting_blood_sugar_mg_dl,
      hba1c_percentage,
      waist_circumference_cm
    } = req.body;

    // Validation
    if (!name || !age || !gender || !height_cm || !baseline_weight_kg || !waist_circumference_cm) {
      return res.status(400).json({
        error: 'Missing required parameters. Name, age, gender, height_cm, baseline_weight_kg, and waist_circumference_cm are required.'
      });
    }

    const userId = uuidv4();
    const targetWeight = target_weight_kg ? parseFloat(target_weight_kg) : 68.0;

    // 1. Insert into Users table
    const userInsertQuery = `
      INSERT INTO users (id, name, age, gender, height_cm, baseline_weight_kg, target_weight_kg)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, age, gender, height_cm, baseline_weight_kg, target_weight_kg, created_at;
    `;
    const userResult = await db.query(userInsertQuery, [
      userId,
      name,
      parseInt(age),
      gender,
      parseFloat(height_cm),
      parseFloat(baseline_weight_kg),
      targetWeight
    ]);

    // 2. Insert into Medical History table
    const medicalInsertQuery = `
      INSERT INTO medical_history (
        user_id, family_history_diabetes, known_masld,
        fasting_blood_sugar_mg_dl, hba1c_percentage, waist_circumference_cm
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const medicalResult = await db.query(medicalInsertQuery, [
      userId,
      Boolean(family_history_diabetes),
      Boolean(known_masld),
      fasting_blood_sugar_mg_dl ? parseFloat(fasting_blood_sugar_mg_dl) : null,
      hba1c_percentage ? parseFloat(hba1c_percentage) : null,
      parseFloat(waist_circumference_cm)
    ]);

    // 3. Compute South Asian Risk Assessment
    const riskAssessment = calculateComprehensiveMetabolicRisk({
      height_cm: parseFloat(height_cm),
      baseline_weight_kg: parseFloat(baseline_weight_kg),
      gender,
      waist_circumference_cm: parseFloat(waist_circumference_cm),
      family_history_diabetes: Boolean(family_history_diabetes),
      known_masld: Boolean(known_masld),
      fasting_blood_sugar_mg_dl: fasting_blood_sugar_mg_dl ? parseFloat(fasting_blood_sugar_mg_dl) : null,
      hba1c_percentage: hba1c_percentage ? parseFloat(hba1c_percentage) : null
    });

    return res.status(201).json({
      message: 'User metabolic profile successfully registered.',
      user: userResult.rows[0],
      medicalHistory: medicalResult.rows[0],
      riskAssessment
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Internal server error while registering user profile.' });
  }
}

/**
 * Get South Asian Health Risk Assessment for User
 * GET /api/v1/users/:id/health-risk
 */
async function getUserHealthRisk(req, res) {
  try {
    const userId = req.params.id;

    const userQuery = `
      SELECT 
        u.id, u.name, u.age, u.gender, u.height_cm, u.baseline_weight_kg, u.target_weight_kg,
        m.family_history_diabetes, m.known_masld, m.fasting_blood_sugar_mg_dl,
        m.hba1c_percentage, m.waist_circumference_cm
      FROM users u
      LEFT JOIN medical_history m ON u.id = m.user_id
      WHERE u.id = $1;
    `;

    const result = await db.query(userQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const userData = result.rows[0];

    const riskAssessment = calculateComprehensiveMetabolicRisk({
      height_cm: parseFloat(userData.height_cm),
      baseline_weight_kg: parseFloat(userData.baseline_weight_kg),
      target_weight_kg: userData.target_weight_kg ? parseFloat(userData.target_weight_kg) : 68.0,
      gender: userData.gender,
      waist_circumference_cm: parseFloat(userData.waist_circumference_cm || 85),
      family_history_diabetes: Boolean(userData.family_history_diabetes),
      known_masld: Boolean(userData.known_masld),
      fasting_blood_sugar_mg_dl: userData.fasting_blood_sugar_mg_dl ? parseFloat(userData.fasting_blood_sugar_mg_dl) : null,
      hba1c_percentage: userData.hba1c_percentage ? parseFloat(userData.hba1c_percentage) : null
    });

    return res.status(200).json({
      userId: userData.id,
      name: userData.name,
      demographics: {
        age: userData.age,
        gender: userData.gender,
        heightCm: parseFloat(userData.height_cm),
        weightKg: parseFloat(userData.baseline_weight_kg)
      },
      riskAssessment
    });
  } catch (error) {
    console.error('Error fetching health risk:', error);
    return res.status(500).json({ error: 'Failed to retrieve health risk score.' });
  }
}

module.exports = {
  registerUser,
  getUserHealthRisk
};
