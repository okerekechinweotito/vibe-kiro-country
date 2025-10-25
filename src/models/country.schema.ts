import { z } from "zod";

/**
 * Country data models and interfaces
 * Requirements: 7.1, 7.2, 7.3
 */

export interface Country {
  id?: number;
  name: string;
  capital?: string;
  region?: string;
  population: number;
  currency_code?: string;
  exchange_rate?: number;
  estimated_gdp?: number;
  flag_url?: string;
  last_refreshed_at?: Date;
}

export interface ExternalCountry {
  name: string;
  capital?: string;
  region?: string;
  population: number;
  flag?: string;
  currencies?: Array<{
    code: string;
    name: string;
    symbol: string;
  }>;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
}

export interface CountryFilters {
  region?: string;
  currency?: string;
  sort?: 'gdp_desc' | 'name_asc';
}

export interface SystemStatus {
  total_countries: number;
  last_refreshed_at: string;
}

// Validation schemas for country data
export const countrySchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1, "Name is required"),
  capital: z.string().optional(),
  region: z.string().optional(),
  population: z.number().int().min(0, "Population must be a non-negative number"),
  currency_code: z.string().min(1, "Currency code is required").optional(),
  exchange_rate: z.number().positive().optional(),
  estimated_gdp: z.number().min(0).optional(),
  flag_url: z.string().url().optional(),
  last_refreshed_at: z.date().optional(),
});

export const externalCountrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  capital: z.string().optional(),
  region: z.string().optional(),
  population: z.number().int().min(0, "Population must be a non-negative number"),
  flag: z.string().url().optional(),
  currencies: z.array(z.object({
    code: z.string(),
    name: z.string(),
    symbol: z.string(),
  })).optional(),
});

export const exchangeRatesSchema = z.object({
  base: z.string().min(1, "Base currency is required"),
  rates: z.record(z.string(), z.number().positive()),
});

export const countryFiltersSchema = z.object({
  region: z.string().optional(),
  currency: z.string().optional(),
  sort: z.enum(['gdp_desc', 'name_asc']).optional(),
}).strict();

export const systemStatusSchema = z.object({
  total_countries: z.number().int().min(0),
  last_refreshed_at: z.string(),
});

// Type inference from schemas
export type CountryInput = z.infer<typeof countrySchema>;
export type ExternalCountryInput = z.infer<typeof externalCountrySchema>;
export type ExchangeRatesInput = z.infer<typeof exchangeRatesSchema>;
export type CountryFiltersInput = z.infer<typeof countryFiltersSchema>;
export type SystemStatusInput = z.infer<typeof systemStatusSchema>;