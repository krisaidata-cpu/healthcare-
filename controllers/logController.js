/**
 * ============================================================================
 * DAILY DIET LOGS CONTROLLER (CRUD OPERATIONS)
 * ============================================================================
 */

const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create Diet Log Entry
 * POST /api/v1/logs/diet
 */
async function createDietLog(req, res) {
  try {
    const { user_id, food_item_id, quantity_multiplier, meal_type } = req.body;

    if (!user_id || !food_item_id || !meal_type) {
      return res.status(400).json({ error: 'user_id, food_item_id, and meal_type are required.' });
    }

    const logId = uuidv4();
    const qty = parseFloat(quantity_multiplier || 1.0);

    const insertQuery = `
      INSERT INTO daily_logs (id, user_id, food_item_id, quantity_multiplier, meal_type, log_date)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
      RETURNING *;
    `;

    const result = await db.query(insertQuery, [logId, user_id, food_item_id, qty, meal_type]);

    return res.status(201).json({
      message: 'Diet log created successfully.',
      log: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating diet log:', error);
    return res.status(500).json({ error: 'Failed to record diet log entry.' });
  }
}

/**
 * Get User's Daily Diet Logs and Macro Summary
 * GET /api/v1/logs/diet/:userId
 */
async function getUserDailyLogs(req, res) {
  try {
    const userId = req.params.userId;
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];

    const logsQuery = `
      SELECT 
        l.id AS log_id,
        l.log_date,
        l.quantity_multiplier,
        l.meal_type,
        f.id AS food_id,
        f.item_name,
        f.base_measure,
        f.regional_cuisine,
        (f.calories * l.quantity_multiplier) AS total_calories,
        (f.carbs_g * l.quantity_multiplier) AS total_carbs,
        (f.proteins_g * l.quantity_multiplier) AS total_proteins,
        (f.fats_g * l.quantity_multiplier) AS total_fats,
        (f.hidden_fats_g * l.quantity_multiplier) AS total_hidden_fats,
        f.glycemic_index_estimate,
        f.is_deep_fried,
        f.contains_maida
      FROM daily_logs l
      JOIN indian_food_database f ON l.food_item_id = f.id
      WHERE l.user_id = $1
      ORDER BY l.created_at DESC;
    `;

    const result = await db.query(logsQuery, [userId]);
    const logs = result.rows;

    // Calculate aggregated daily totals
    const totalMacros = logs.reduce((acc, curr) => {
      acc.calories += parseFloat(curr.total_calories || 0);
      acc.carbsG += parseFloat(curr.total_carbs || 0);
      acc.proteinsG += parseFloat(curr.total_proteins || 0);
      acc.fatsG += parseFloat(curr.total_fats || 0);
      acc.hiddenFatsG += parseFloat(curr.total_hidden_fats || 0);
      return acc;
    }, { calories: 0, carbsG: 0, proteinsG: 0, fatsG: 0, hiddenFatsG: 0 });

    // Round macro numbers
    totalMacros.calories = Math.round(totalMacros.calories);
    totalMacros.carbsG = parseFloat(totalMacros.carbsG.toFixed(1));
    totalMacros.proteinsG = parseFloat(totalMacros.proteinsG.toFixed(1));
    totalMacros.fatsG = parseFloat(totalMacros.fatsG.toFixed(1));
    totalMacros.hiddenFatsG = parseFloat(totalMacros.hiddenFatsG.toFixed(1));

    return res.status(200).json({
      date: dateStr,
      logsCount: logs.length,
      dailySummary: totalMacros,
      logs
    });
  } catch (error) {
    console.error('Error fetching diet logs:', error);
    return res.status(500).json({ error: 'Failed to retrieve diet logs.' });
  }
}

/**
 * Delete a Diet Log
 * DELETE /api/v1/logs/diet/:logId
 */
async function deleteDietLog(req, res) {
  try {
    const logId = req.params.logId;
    const deleteQuery = `DELETE FROM daily_logs WHERE id = $1 RETURNING id;`;
    const result = await db.query(deleteQuery, [logId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Diet log entry not found.' });
    }

    return res.status(200).json({ message: 'Diet log deleted successfully.', logId });
  } catch (error) {
    console.error('Error deleting diet log:', error);
    return res.status(500).json({ error: 'Failed to delete diet log.' });
  }
}

module.exports = {
  createDietLog,
  getUserDailyLogs,
  deleteDietLog
};
