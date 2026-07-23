/**
 * ============================================================================
 * MODEL CONTEXT PROTOCOL (MCP) COMPATIBILITY CONTROLLER
 * Enables AI Agents (Antigravity/LLMs) to query user health metrics,
 * perform dietary evaluations, and recommend South Asian metabolic interventions.
 * ============================================================================
 */

const { calculateComprehensiveMetabolicRisk } = require('../utils/riskCalculator');
const db = require('../config/db');

/**
 * MCP Dietary & Visceral Fat AI Assessment Endpoint
 * POST /api/v1/mcp/analyze-diet
 */
async function analyzeDietMCP(req, res) {
  try {
    const { userId, loggedMeals = [], currentMetabolicProfile } = req.body;

    // Calculate total meal load
    const mealTotals = loggedMeals.reduce((acc, m) => {
      const qty = parseFloat(m.quantity_multiplier || 1);
      acc.totalCarbs += (parseFloat(m.carbs_g || 0) * qty);
      acc.totalProteins += (parseFloat(m.proteins_g || 0) * qty);
      acc.totalFats += (parseFloat(m.fats_g || 0) * qty);
      acc.hiddenFats += (parseFloat(m.hidden_fats_g || 0) * qty);
      acc.calories += (parseFloat(m.calories || 0) * qty);
      if (m.is_deep_fried) acc.deepFriedItemsCount += 1;
      if (m.contains_maida) acc.maidaItemsCount += 1;
      return acc;
    }, { totalCarbs: 0, totalProteins: 0, totalFats: 0, hiddenFats: 0, calories: 0, deepFriedItemsCount: 0, maidaItemsCount: 0 });

    const carbToProteinRatio = mealTotals.totalProteins > 0 
      ? parseFloat((mealTotals.totalCarbs / mealTotals.totalProteins).toFixed(2))
      : mealTotals.totalCarbs;

    // Generate AI recommendations specifically tuned for South Asian metabolic risk
    const aiRecommendations = [];

    if (carbToProteinRatio > 3.0) {
      aiRecommendations.push({
        type: 'CARB_OVERLOAD_WARNING',
        severity: 'HIGH',
        message: `High Carbohydrate to Protein Ratio (${carbToProteinRatio}:1). Excess refined carbs promote hepatic de novo lipogenesis, directly worsening liver fat (MASLD). Recommend replacing 1 katori rice/roti with sprouts, dal, or paneer.`
      });
    }

    if (mealTotals.hiddenFats > 10.0) {
      aiRecommendations.push({
        type: 'HIDDEN_FAT_WARNING',
        severity: 'MEDIUM',
        message: `Detected ${mealTotals.hiddenFats}g of hidden saturated fats (Ghee/Vanaspati/Dalda). Reduce oil/ghee tempering in dal and gravy dishes.`
      });
    }

    if (mealTotals.deepFriedItemsCount > 0) {
      aiRecommendations.push({
        type: 'REFINED_SNACK_WARNING',
        severity: 'HIGH',
        message: `Deep-fried regional snacks increase trans-fats and postprandial inflammatory responses. Substitute with roasted chana or makhana.`
      });
    }

    return res.status(200).json({
      mcpProtocolVersion: '1.0',
      agentTool: 'south_asian_metabolic_diet_analyzer',
      status: 'success',
      contextSummary: {
        userId: userId || 'anonymous',
        totalCarbohydratesG: Math.round(mealTotals.totalCarbs),
        totalProteinsG: Math.round(mealTotals.totalProteins),
        totalHiddenFatsG: Math.round(mealTotals.hiddenFats),
        carbToProteinRatio,
        metabolicRiskTriggersDetected: aiRecommendations.length
      },
      aiRecommendations
    });
  } catch (error) {
    console.error('MCP AI Analysis Error:', error);
    return res.status(500).json({ error: 'MCP Analysis execution failed.' });
  }
}

module.exports = {
  analyzeDietMCP
};
