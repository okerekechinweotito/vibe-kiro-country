import { CountryRepository } from './country-repository.service.js';
import { CountriesAPIClient, ExchangeRatesAPIClient, ExternalAPIError } from './external-api.service.js';
import { SystemStatusService } from './system-status.service.js';
import type { Country, CountryFilters, ExternalCountry, SystemStatus } from '../models/country.schema.js';

/**
 * Country Business Logic Service
 * Handles country operations with external API integration and GDP calculations
 * Requirements: 1.4, 8.1, 8.2, 8.3, 8.4
 */

export class CountryService {
  private countryRepository: CountryRepository;
  private countriesAPI: CountriesAPIClient;
  private exchangeRatesAPI: ExchangeRatesAPIClient;
  private systemStatusService: SystemStatusService;

  constructor() {
    this.countryRepository = new CountryRepository();
    this.countriesAPI = new CountriesAPIClient();
    this.exchangeRatesAPI = new ExchangeRatesAPIClient();
    this.systemStatusService = new SystemStatusService();
  }

  /**
   * Refresh countries data from external APIs
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4
   */
  async refreshCountries(): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;

    try {
      // Step 1: Fetch countries data from external API
      // Requirements: 1.1 - fetch country data with specified fields
      const externalCountries = await this.countriesAPI.fetchCountries();
      
      if (externalCountries.length === 0) {
        throw new Error('No countries data received from external API');
      }

      // Step 2: Extract unique currency codes for exchange rate fetching
      // Requirements: 1.2 - extract first currency code from currencies array
      const currencyCodes = this.extractUniqueCurrencyCodes(externalCountries);
      
      // Step 3: Fetch exchange rates for all currencies
      // Requirements: 1.3 - fetch exchange rates using USD as base currency
      const exchangeRatesMap = await this.fetchExchangeRatesForCurrencies(currencyCodes);

      // Step 4: Process each country
      for (const externalCountry of externalCountries) {
        try {
          const processedCountry = await this.processCountryData(externalCountry, exchangeRatesMap);
          await this.countryRepository.upsertCountry(processedCountry);
          processed++;
        } catch (error) {
          const errorMsg = `Failed to process country ${externalCountry.name}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.warn(errorMsg);
        }
      }

      // Step 5: Update system status after successful refresh
      // Requirements: 5.1, 5.2 - track total countries and last refresh timestamp
      if (processed > 0) {
        await this.systemStatusService.refreshSystemStatusFromDatabase();
      }

      return {
        success: processed > 0,
        processed,
        errors
      };

    } catch (error) {
      if (error instanceof ExternalAPIError) {
        // Re-throw external API errors for proper HTTP status handling
        throw error;
      }
      
      const errorMsg = `Refresh operation failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      
      return {
        success: false,
        processed,
        errors
      };
    }
  }

  /**
   * Get all countries with optional filtering and sorting
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  async getAllCountries(filters: CountryFilters = {}): Promise<Country[]> {
    return await this.countryRepository.findCountries(filters);
  }

  /**
   * Get a single country by name
   * Requirements: 3.1, 3.2, 3.3
   */
  async getCountryByName(name: string): Promise<Country | null> {
    return await this.countryRepository.findCountryByName(name);
  }

  /**
   * Delete a country by name
   * Requirements: 4.1, 4.2, 4.3
   */
  async deleteCountryByName(name: string): Promise<boolean> {
    const deleted = await this.countryRepository.deleteCountryByName(name);
    
    // Update system status if country was successfully deleted
    // Requirements: 5.1 - track total countries
    if (deleted) {
      await this.systemStatusService.decrementCountryCount();
    }
    
    return deleted;
  }

  /**
   * Get system status with country count and last refresh timestamp
   * Requirements: 5.1, 5.2, 5.3
   */
  async getSystemStatus(): Promise<SystemStatus> {
    return await this.systemStatusService.getSystemStatus();
  }

  /**
   * Extract unique currency codes from external countries data
   * Requirements: 1.2, 8.1, 8.2 - extract first currency code, handle multiple currencies and empty arrays
   */
  private extractUniqueCurrencyCodes(countries: ExternalCountry[]): string[] {
    const currencySet = new Set<string>();

    for (const country of countries) {
      // Handle currency edge cases
      if (country.currencies && Array.isArray(country.currencies) && country.currencies.length > 0) {
        // Requirements: 8.1 - store only the first currency code from currencies array
        const firstCurrency = country.currencies[0];
        if (firstCurrency && firstCurrency.code) {
          currencySet.add(firstCurrency.code.toUpperCase());
        }
      }
      // Requirements: 8.2 - handle empty currencies array (no currency added to set)
    }

    return Array.from(currencySet);
  }

  /**
   * Fetch exchange rates for multiple currencies
   * Requirements: 1.3, 8.3, 9.2, 9.3
   */
  private async fetchExchangeRatesForCurrencies(currencyCodes: string[]): Promise<Map<string, number | null>> {
    if (currencyCodes.length === 0) {
      return new Map();
    }

    try {
      return await this.exchangeRatesAPI.getMultipleExchangeRates(currencyCodes);
    } catch (error) {
      // Requirements: 8.3, 9.2 - handle exchange API failures
      console.warn('Failed to fetch exchange rates, proceeding with null rates:', error);
      
      // Return map with all currencies set to null
      const nullRatesMap = new Map<string, number | null>();
      for (const currencyCode of currencyCodes) {
        nullRatesMap.set(currencyCode, null);
      }
      return nullRatesMap;
    }
  }

  /**
   * Process individual country data with GDP calculation
   * Requirements: 1.4, 8.1, 8.2, 8.3, 8.4
   */
  private async processCountryData(
    externalCountry: ExternalCountry, 
    exchangeRatesMap: Map<string, number | null>
  ): Promise<Omit<Country, 'id' | 'created_at'>> {
    
    // Extract currency information
    let currencyCode: string | null = null;
    let exchangeRate: number | null = null;

    if (externalCountry.currencies && Array.isArray(externalCountry.currencies) && externalCountry.currencies.length > 0) {
      // Requirements: 8.1 - store only the first currency code
      const firstCurrency = externalCountry.currencies[0];
      if (firstCurrency && firstCurrency.code) {
        currencyCode = firstCurrency.code.toUpperCase();
        exchangeRate = exchangeRatesMap.get(currencyCode) || null;
      }
    }
    // Requirements: 8.2 - handle empty currencies array (currencyCode remains null)

    // Calculate estimated GDP
    // Requirements: 1.4, 8.4 - calculate estimated_gdp using population × random(1000-2000) ÷ exchange_rate
    const estimatedGdp = this.calculateEstimatedGDP(externalCountry.population, exchangeRate);

    return {
      name: externalCountry.name,
      capital: externalCountry.capital || undefined,
      region: externalCountry.region || undefined,
      population: externalCountry.population,
      currency_code: currencyCode || undefined,
      exchange_rate: exchangeRate || undefined,
      estimated_gdp: estimatedGdp || undefined,
      flag_url: externalCountry.flag || undefined,
      last_refreshed_at: new Date()
    };
  }

  /**
   * Calculate estimated GDP using the specified formula
   * Requirements: 1.4, 8.4 - GDP calculation with random multiplier and exchange rate handling
   */
  private calculateEstimatedGDP(population: number, exchangeRate: number | null): number | null {
    // Requirements: 8.2, 8.3 - handle missing exchange rate data
    if (exchangeRate === null || exchangeRate === undefined || exchangeRate <= 0) {
      // Requirements: 8.2 - set estimated_gdp to null when exchange_rate is null
      // Requirements: 8.3 - set estimated_gdp to null when currency not found in exchange API
      return null;
    }

    if (population <= 0) {
      return 0;
    }

    // Requirements: 1.4 - calculate using formula: population × random(1000-2000) ÷ exchange_rate
    const randomMultiplier = Math.random() * (2000 - 1000) + 1000; // Random number between 1000-2000
    const estimatedGdp = (population * randomMultiplier) / exchangeRate;

    // Round to 2 decimal places for currency precision
    return Math.round(estimatedGdp * 100) / 100;
  }
}