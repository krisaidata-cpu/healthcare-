/**
 * ============================================================================
 * INDIAN FOOD DATABASE & SEARCH CONTROLLER
 * ============================================================================
 */

const db = require('../config/db');

/**
 * Search Indian Food Database
 * GET /api/v1/food/search?query={regional_food}&cuisine={cuisine}
 */
async function searchFood(req, res) {
  try {
    const searchTerm = req.query.query || req.query.q || '';
    const cuisine = req.query.cuisine || '';

    let queryText = `
      SELECT 
        id, item_name, regional_cuisine, base_measure,
        calories, carbs_g, proteins_g, fats_g, hidden_fats_g,
        glycemic_index_estimate, is_deep_fried, contains_maida
      FROM indian_food_database
    `;

    const conditions = [];
    const params = [];

    if (searchTerm.trim() !== '') {
      params.push(`%${searchTerm.trim()}%`);
      conditions.push(`item_name ILIKE $${params.length}`);
    }

    if (cuisine.trim() !== '' && cuisine.toLowerCase() !== 'all') {
      params.push(cuisine.trim());
      conditions.push(`regional_cuisine = $${params.length}::regional_cuisine_enum`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY item_name ASC LIMIT 50;';

    const result = await db.query(queryText, params);

    return res.status(200).json({
      count: result.rows.length,
      query: searchTerm,
      cuisineFilter: cuisine || 'All',
      foods: result.rows
    });
  } catch (error) {
    console.error('Error searching Indian food database:', error);
    return res.status(500).json({ error: 'Error querying Indian food database.' });
  }
}

module.exports = {
  searchFood
};
