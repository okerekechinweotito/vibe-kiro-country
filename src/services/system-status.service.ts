import { getDatabase } from './db.service.js';
import type { SystemStatus } from '../models/country.schema.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * System Status Service
 * Handles system status tracking in the system_status table
 * Requirements: 5.1, 5.2, 5.3
 */

export class SystemStatusService {
  private db = getDatabase();

  /**
   * Update system status after a refresh operation
   * Requirements: 5.1, 5.2 - track total countries and last refresh timestamp
   */
  async updateSystemStatus(totalCountries: number, lastRefreshedAt: Date = new Date()): Promise<void> {
    await this.db.execute(
      `UPDATE system_status 
       SET total_countries = ?, last_refreshed_at = ? 
       WHERE id = 1`,
      [totalCountries, lastRefreshedAt]
    );
  }

  /**
   * Get current system status
   * Requirements: 5.1, 5.2, 5.3 - return total_countries and last_refreshed_at
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      'SELECT total_countries, last_refreshed_at FROM system_status WHERE id = 1'
    );

    if (rows.length === 0) {
      // Initialize system status if not exists
      await this.initializeSystemStatus();
      return {
        total_countries: 0,
        last_refreshed_at: 'Never'
      };
    }

    const row = rows[0];
    return {
      total_countries: row.total_countries || 0,
      last_refreshed_at: row.last_refreshed_at 
        ? new Date(row.last_refreshed_at).toISOString() 
        : 'Never'
    };
  }

  /**
   * Initialize system status record if it doesn't exist
   * Requirements: 5.2 - ensure system_status table has initial record
   */
  async initializeSystemStatus(): Promise<void> {
    await this.db.execute(
      'INSERT IGNORE INTO system_status (id, total_countries, last_refreshed_at) VALUES (1, 0, NULL)'
    );
  }

  /**
   * Update system status based on current countries count
   * This method counts countries from the database and updates the system status
   * Requirements: 5.1, 5.2
   */
  async refreshSystemStatusFromDatabase(): Promise<SystemStatus> {
    // Get current count from countries table
    const [countRows] = await this.db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM countries'
    );
    
    const totalCountries = countRows[0]?.count || 0;

    // Get the most recent refresh timestamp from countries
    const [timestampRows] = await this.db.execute<RowDataPacket[]>(
      'SELECT MAX(last_refreshed_at) as last_refresh FROM countries'
    );
    
    const lastRefresh = timestampRows[0]?.last_refresh;

    // Update system status
    if (lastRefresh) {
      await this.updateSystemStatus(totalCountries, new Date(lastRefresh));
    } else {
      // If no countries have been refreshed, just update the count
      await this.db.execute(
        'UPDATE system_status SET total_countries = ? WHERE id = 1',
        [totalCountries]
      );
    }

    return await this.getSystemStatus();
  }

  /**
   * Increment country count (used when adding individual countries)
   * Requirements: 5.1
   */
  async incrementCountryCount(): Promise<void> {
    await this.db.execute(
      'UPDATE system_status SET total_countries = total_countries + 1 WHERE id = 1'
    );
  }

  /**
   * Decrement country count (used when deleting individual countries)
   * Requirements: 5.1
   */
  async decrementCountryCount(): Promise<void> {
    await this.db.execute(
      'UPDATE system_status SET total_countries = GREATEST(0, total_countries - 1) WHERE id = 1'
    );
  }
}