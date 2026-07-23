/**
 * ============================================================================
 * RESTFUL API ROUTER - SOUTH ASIAN METABOLIC HEALTH PLATFORM
 * ============================================================================
 */

const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const logController = require('../controllers/logController');
const foodController = require('../controllers/foodController');
const mcpController = require('../controllers/mcpController');

// ----------------------------------------------------------------------------
// 1. User & Health Risk Endpoints
// ----------------------------------------------------------------------------
router.post('/users/register', userController.registerUser);
router.get('/users/:id/health-risk', userController.getUserHealthRisk);

// ----------------------------------------------------------------------------
// 2. Daily Diet Log Endpoints
// ----------------------------------------------------------------------------
router.post('/logs/diet', logController.createDietLog);
router.get('/logs/diet/:userId', logController.getUserDailyLogs);
router.delete('/logs/diet/:logId', logController.deleteDietLog);

// ----------------------------------------------------------------------------
// 3. Indian Food Database Search Endpoint
// ----------------------------------------------------------------------------
router.get('/food/search', foodController.searchFood);

// ----------------------------------------------------------------------------
// 4. Model Context Protocol (MCP) AI Endpoint
// ----------------------------------------------------------------------------
router.post('/mcp/analyze-diet', mcpController.analyzeDietMCP);

module.exports = router;
