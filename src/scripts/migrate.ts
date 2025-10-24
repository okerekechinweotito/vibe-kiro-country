#!/usr/bin/env tsx

/**
 * Database migration runner script
 * Usage: tsx src/scripts/migrate.ts
 */

import { initializeDatabase, runMigrations, closeDatabase } from '../services/db.service.js';

async function main() {
  try {
    console.log('Initializing database connection...');
    initializeDatabase();
    
    console.log('Running database migrations...');
    await runMigrations();
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

main();