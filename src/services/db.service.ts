import mysql from 'mysql2/promise';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Database configuration interface
interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

// Default database configuration
const defaultConfig: DatabaseConfig = {
  host: process.env.MYSQLHOST || 'localhost',
  port: parseInt(process.env.MYSQLPORT || '3306'),
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'countries_db',
  connectionLimit: 10
};

// Connection pool
let pool: mysql.Pool | null = null;

/**
 * Initialize database connection pool
 */
export function initializeDatabase(config: DatabaseConfig = defaultConfig): mysql.Pool {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: config.connectionLimit,
    queueLimit: 0
  });

  return pool;
}

/**
 * Get database connection pool
 */
export function getDatabase(): mysql.Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
  const db = getDatabase();
  
  try {
    // Read and execute migration files
    const migrations = [
      '001_create_countries_table.sql',
      '002_create_system_status_table.sql'
    ];

    for (const migrationFile of migrations) {
      const migrationPath = join(process.cwd(), 'src', 'migrations', migrationFile);
      const migrationSQL = await readFile(migrationPath, 'utf-8');
      
      // Split by semicolon and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        await db.execute(statement);
      }
      
      console.log(`Migration ${migrationFile} executed successfully`);
    }

    // Verify that the countries table exists
    const [rows] = await db.execute("SHOW TABLES LIKE 'countries'");
    console.log('Verification query result:', rows);
    if (Array.isArray(rows) && rows.length > 0) {
      console.log('Verification successful: countries table exists.');
    } else {
      console.error('Verification failed: countries table does not exist after migration.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
