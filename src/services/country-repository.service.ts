import { getDatabase } from './db.service.js';
import type { Country, CountryFilters } from '../models/country.schema.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Country Repository Service
 * Handles all database operations for countries table
 * Requirements: 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 4.1, 4.2
 */

export class CountryRepository {
  private db = getDatabase();

  /**
   * Insert or update a country record using case-insensitive name matching
   * Requirements: 1.5
   */
  async upsertCountry(country: Omit<Country, 'id'>): Promise<Country> {
    const connection = await this.db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if country exists (case-insensitive)
      const [existingRows] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM countries WHERE LOWER(name) = LOWER(?)',
        [country.name]
      );

      let countryId: number;

      if (existingRows.length > 0) {
        // Update existing country
        const existingId = existingRows[0].id;
        await connection.execute(
          `UPDATE countries SET 
           name = ?, capital = ?, region = ?, population = ?, 
           currency_code = ?, exchange_rate = ?, estimated_gdp = ?, 
           flag_url = ?, last_refreshed_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            country.name,
            country.capital || null,
            country.region || null,
            country.population,
            country.currency_code || null,
            country.exchange_rate || null,
            country.estimated_gdp || null,
            country.flag_url || null,
            existingId
          ]
        );
        countryId = existingId;
      } else {
        // Insert new country
        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO countries 
           (name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            country.name,
            country.capital || null,
            country.region || null,
            country.population,
            country.currency_code || null,
            country.exchange_rate || null,
            country.estimated_gdp || null,
            country.flag_url || null
          ]
        );
        countryId = result.insertId;
      }

      await connection.commit();

      // Return the updated/inserted country
      return await this.findCountryById(countryId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Find all countries with optional filtering and sorting
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  async findCountries(filters: CountryFilters = {}): Promise<Country[]> {
    let query = 'SELECT * FROM countries WHERE 1=1';
    const params: any[] = [];

    // Apply region filter
    if (filters.region) {
      query += ' AND region = ?';
      params.push(filters.region);
    }

    // Apply currency filter
    if (filters.currency) {
      query += ' AND currency_code = ?';
      params.push(filters.currency);
    }

    // Apply sorting
    if (filters.sort === 'gdp_desc') {
      query += ' ORDER BY estimated_gdp DESC';
    } else if (filters.sort === 'name_asc') {
      query += ' ORDER BY name ASC';
    }

    const [rows] = await this.db.execute<RowDataPacket[]>(query, params);
    return rows.map(this.mapRowToCountry);
  }

  /**
   * Find a country by name (case-insensitive)
   * Requirements: 3.1
   */
  async findCountryByName(name: string): Promise<Country | null> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      'SELECT * FROM countries WHERE LOWER(name) = LOWER(?)',
      [name]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToCountry(rows[0]);
  }

  /**
   * Find a country by ID
   */
  async findCountryById(id: number): Promise<Country> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      'SELECT * FROM countries WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      throw new Error(`Country with id ${id} not found`);
    }

    return this.mapRowToCountry(rows[0]);
  }

  /**
   * Delete a country by name (case-insensitive)
   * Requirements: 4.1, 4.2
   */
  async deleteCountryByName(name: string): Promise<boolean> {
    const [result] = await this.db.execute<ResultSetHeader>(
      'DELETE FROM countries WHERE LOWER(name) = LOWER(?)',
      [name]
    );

    return result.affectedRows > 0;
  }

  /**
   * Get total count of countries
   * Requirements: 5.1
   */
  async getCountryCount(): Promise<number> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM countries'
    );

    return rows[0].count;
  }

  /**
   * Get the most recent refresh timestamp
   * Requirements: 5.2
   */
  async getLastRefreshTimestamp(): Promise<Date | null> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      'SELECT MAX(last_refreshed_at) as last_refresh FROM countries'
    );

    return rows[0].last_refresh || null;
  }

  /**
   * Map database row to Country interface
   */
  private mapRowToCountry(row: RowDataPacket): Country {
    return {
      id: row.id,
      name: row.name,
      capital: row.capital,
      region: row.region,
      population: row.population,
      currency_code: row.currency_code,
      exchange_rate: row.exchange_rate ? parseFloat(row.exchange_rate) : undefined,
      estimated_gdp: row.estimated_gdp ? parseFloat(row.estimated_gdp) : undefined,
      flag_url: row.flag_url,
      last_refreshed_at: row.last_refreshed_at
    };
  }
}