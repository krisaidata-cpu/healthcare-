/**
 * ============================================================================
 * DATABASE INITIALIZATION & SEEDING SCRIPT FOR NEON DB / POSTGRESQL
 * Usage: node scripts/initDb.js
 * ============================================================================
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL environment variable is missing.');
  console.error('Please set DATABASE_URL in .env before running this database init script.');
  process.exit(1);
}

async function runDatabaseBuild() {
  console.log('🚀 Connecting to Neon DB PostgreSQL instance...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✔ Connected to Neon DB Cloud PostgreSQL.');

    const sqlFilePath = path.join(__dirname, '..', 'database', 'init.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('⚙️ Executing DDL schema statements and inserting seed food items...');
    await client.query(sqlContent);

    console.log('✅ DATABASE BUILD & SEEDING COMPLETED SUCCESSFULLY!');
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ DATABASE SEEDING ERROR:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runDatabaseBuild();
