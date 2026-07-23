/**
 * ============================================================================
 * MAIN EXPRESS SERVER - SOUTH ASIAN METABOLIC HEALTH & MASLD SYSTEM
 * Backed by Neon DB Cloud PostgreSQL API
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const { initializeNeonDatabase, isConnectedToNeon } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API v1 Routes
app.use('/api/v1', apiRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'South Asian Metabolic Health Platform',
    neonDbConnected: isConnectedToNeon,
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for Single Page App routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server & Initialize Neon Database
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`  METABOLIC HEALTH SERVER STARTED ON PORT ${PORT}`);
  console.log(`  Access Web App: http://localhost:${PORT}`);
  console.log(`  Neon DB Status: ${isConnectedToNeon ? 'CONNECTED (Cloud PostgreSQL)' : 'Zero-Config Demo Mode'}`);
  console.log(`=======================================================`);

  // Attempt database schema initialization on Neon DB
  if (isConnectedToNeon) {
    await initializeNeonDatabase();
  }
});
