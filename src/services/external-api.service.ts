import type { ExternalCountry, ExchangeRates } from '../models/country.schema.ts';

/**
 * External API integration services
 * Requirements: 1.1, 1.3, 8.3, 9.1, 9.2, 9.3
 */

// Configuration for external APIs
const EXTERNAL_API_CONFIG = {
  COUNTRIES_API_URL: process.env.COUNTRIES_API_URL || 'https://restcountries.com/v3.1',
  EXCHANGE_API_URL: process.env.EXCHANGE_API_URL || 'https://open.er-api.com/v6',
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '10000'), // 10 seconds default
};

/**
 * Custom error class for external API failures
 */
export class ExternalAPIError extends Error {
  public apiName: string;
  public statusCode?: number;
  public originalError?: Error;

  constructor(
    message: string,
    apiName: string,
    statusCode?: number,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ExternalAPIError';
    this.apiName = apiName;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Generic fetch with timeout and error handling
 */
async function fetchWithTimeout(url: string, timeout: number = EXTERNAL_API_CONFIG.API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Country-Currency-API/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ExternalAPIError('Request timeout', 'fetch', 408, error);
      }
      throw new ExternalAPIError('Network error', 'fetch', 0, error);
    }
    
    throw new ExternalAPIError('Unknown error', 'fetch', 0);
  }
}

/**
 * REST Countries API client
 * Fetches country data from restcountries.com API
 * Requirements: 1.1, 9.1, 9.3
 */
export class CountriesAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = EXTERNAL_API_CONFIG.COUNTRIES_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch all countries with specific fields
   * Requirements: 1.1 - fetch country data with fields name, capital, region, population, flag, and currencies
   */
  async fetchCountries(): Promise<ExternalCountry[]> {
    const fields = 'name,capital,region,population,flags,currencies';
    const url = `${this.baseUrl}/all?fields=${fields}`;

    try {
      const response = await fetchWithTimeout(url);

      if (!response.ok) {
        throw new ExternalAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          'REST Countries API',
          response.status
        );
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new ExternalAPIError(
          'Invalid response format: expected array',
          'REST Countries API'
        );
      }

      // Transform the external API format to our internal format
      return this.transformCountriesData(data);

    } catch (error) {
      if (error instanceof ExternalAPIError) {
        throw error;
      }
      
      throw new ExternalAPIError(
        'Failed to fetch countries data',
        'REST Countries API',
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Transform external API response to internal format
   * Handles various edge cases in the REST Countries API response
   */
  private transformCountriesData(data: any[]): ExternalCountry[] {
    return data.map(country => {
      // Handle country name - REST Countries API v3.1 has nested name structure
      const name = typeof country.name === 'string' 
        ? country.name 
        : country.name?.common || country.name?.official || 'Unknown';

      // Handle capital - can be array or string
      const capital = Array.isArray(country.capital) 
        ? country.capital[0] 
        : country.capital;

      // Handle population - ensure it's a number
      const population = typeof country.population === 'number' 
        ? country.population 
        : parseInt(String(country.population)) || 0;

      // Handle flag URL - REST Countries API v3.1 has nested flags structure
      const flag = country.flags?.png || country.flags?.svg || country.flag;

      // Handle currencies - transform to our expected format
      const currencies = this.transformCurrencies(country.currencies);

      return {
        name,
        capital,
        region: country.region,
        population,
        flag,
        currencies
      };
    }).filter(country => {
      // Filter out countries with invalid data
      return country.name && country.name !== 'Unknown' && country.population >= 0;
    });
  }

  /**
   * Transform currencies from REST Countries API format
   * Requirements: 1.2 - extract first currency code from currencies array
   */
  private transformCurrencies(currencies: any): Array<{ code: string; name: string; symbol: string }> | undefined {
    if (!currencies || typeof currencies !== 'object') {
      return undefined;
    }

    // REST Countries API v3.1 returns currencies as object with currency codes as keys
    const currencyArray = Object.entries(currencies).map(([code, details]: [string, any]) => ({
      code,
      name: details?.name || code,
      symbol: details?.symbol || code
    }));

    return currencyArray.length > 0 ? currencyArray : undefined;
  }
}
/**
 *
 Exchange Rates API client
 * Fetches exchange rates from open.er-api.com
 * Requirements: 1.3, 8.3, 9.2, 9.3
 */
export class ExchangeRatesAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = EXTERNAL_API_CONFIG.EXCHANGE_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch exchange rates with USD as base currency
   * Requirements: 1.3 - fetch exchange rates using USD as base currency
   */
  async fetchExchangeRates(): Promise<ExchangeRates> {
    const url = `${this.baseUrl}/latest/USD`;

    try {
      const response = await fetchWithTimeout(url);

      if (!response.ok) {
        throw new ExternalAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          'Exchange Rates API',
          response.status
        );
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.rates || typeof data.rates !== 'object') {
        throw new ExternalAPIError(
          'Invalid response format: missing or invalid rates object',
          'Exchange Rates API'
        );
      }

      return {
        base: data.base_code || 'USD',
        rates: data.rates
      };

    } catch (error) {
      if (error instanceof ExternalAPIError) {
        throw error;
      }
      
      throw new ExternalAPIError(
        'Failed to fetch exchange rates',
        'Exchange Rates API',
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get exchange rate for a specific currency
   * Requirements: 8.3 - handle currency code matching and missing rates
   */
  async getExchangeRate(currencyCode: string): Promise<number | null> {
    try {
      const exchangeRates = await this.fetchExchangeRates();
      
      // Handle case-insensitive currency code matching
      const upperCurrencyCode = currencyCode.toUpperCase();
      
      // Check if the currency exists in the rates
      if (upperCurrencyCode in exchangeRates.rates) {
        return exchangeRates.rates[upperCurrencyCode];
      }
      
      // Currency not found - return null as per requirement 8.3
      return null;
      
    } catch (error) {
      // Re-throw ExternalAPIError as-is, wrap others
      if (error instanceof ExternalAPIError) {
        throw error;
      }
      
      throw new ExternalAPIError(
        `Failed to get exchange rate for ${currencyCode}`,
        'Exchange Rates API',
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get multiple exchange rates for an array of currency codes
   * Returns a map of currency codes to exchange rates (null for missing currencies)
   * Requirements: 8.3 - handle missing rates
   */
  async getMultipleExchangeRates(currencyCodes: string[]): Promise<Map<string, number | null>> {
    const result = new Map<string, number | null>();
    
    try {
      const exchangeRates = await this.fetchExchangeRates();
      
      for (const currencyCode of currencyCodes) {
        const upperCurrencyCode = currencyCode.toUpperCase();
        
        if (upperCurrencyCode in exchangeRates.rates) {
          result.set(currencyCode, exchangeRates.rates[upperCurrencyCode]);
        } else {
          result.set(currencyCode, null);
        }
      }
      
      return result;
      
    } catch (error) {
      // If we can't fetch exchange rates, set all currencies to null
      for (const currencyCode of currencyCodes) {
        result.set(currencyCode, null);
      }
      
      // Still throw the error for proper error handling upstream
      if (error instanceof ExternalAPIError) {
        throw error;
      }
      
      throw new ExternalAPIError(
        'Failed to fetch multiple exchange rates',
        'Exchange Rates API',
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

/**
 * Factory function to create API clients with default configuration
 */
export function createAPIClients() {
  return {
    countriesAPI: new CountriesAPIClient(),
    exchangeRatesAPI: new ExchangeRatesAPIClient()
  };
}

/**
 * Convenience function to test API connectivity
 * Useful for health checks and debugging
 */
export async function testAPIConnectivity(): Promise<{ countries: boolean; exchangeRates: boolean }> {
  const { countriesAPI, exchangeRatesAPI } = createAPIClients();
  
  const results = {
    countries: false,
    exchangeRates: false
  };
  
  // Test Countries API
  try {
    await countriesAPI.fetchCountries();
    results.countries = true;
  } catch (error) {
    console.warn('Countries API connectivity test failed:', error);
  }
  
  // Test Exchange Rates API
  try {
    await exchangeRatesAPI.fetchExchangeRates();
    results.exchangeRates = true;
  } catch (error) {
    console.warn('Exchange Rates API connectivity test failed:', error);
  }
  
  return results;
}