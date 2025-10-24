import { z } from "zod";
import { countrySchema, externalCountrySchema, countryFiltersSchema } from "../models/country.schema.js";

/**
 * Validation utilities for country data
 * Requirements: 7.1, 7.2, 7.3
 */

export interface ValidationError {
  error: string;
  details: Record<string, string>;
}

export class CountryValidationError extends Error {
  public details: Record<string, string>;

  constructor(message: string, details: Record<string, string>) {
    super(message);
    this.name = "CountryValidationError";
    this.details = details;
  }
}

/**
 * Validates country data and throws CountryValidationError if validation fails
 * @param data - Country data to validate
 * @throws CountryValidationError
 */
export function validateCountryData(data: unknown): void {
  try {
    countrySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = formatZodErrors(error);
      throw new CountryValidationError("Validation failed", details);
    }
    throw error;
  }
}

/**
 * Validates external country data and throws CountryValidationError if validation fails
 * @param data - External country data to validate
 * @throws CountryValidationError
 */
export function validateExternalCountryData(data: unknown): void {
  try {
    externalCountrySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = formatZodErrors(error);
      throw new CountryValidationError("Validation failed", details);
    }
    throw error;
  }
}

/**
 * Validates country filters and throws CountryValidationError if validation fails
 * @param data - Country filters to validate
 * @throws CountryValidationError
 */
export function validateCountryFilters(data: unknown): void {
  try {
    countryFiltersSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = formatZodErrors(error);
      throw new CountryValidationError("Validation failed", details);
    }
    throw error;
  }
}

/**
 * Validates required fields for country data (name, population, currency_code)
 * @param data - Partial country data to validate
 * @throws CountryValidationError
 */
export function validateRequiredCountryFields(data: any): void {
  const errors: Record<string, string> = {};

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.name = 'is required and must be a non-empty string';
  }

  if (data.population === undefined || data.population === null || typeof data.population !== 'number' || data.population < 0) {
    errors.population = 'is required and must be a non-negative number';
  }

  if (data.currency_code !== undefined && data.currency_code !== null && (typeof data.currency_code !== 'string' || data.currency_code.trim().length === 0)) {
    errors.currency_code = 'must be a non-empty string when provided';
  }

  if (Object.keys(errors).length > 0) {
    throw new CountryValidationError("Validation failed", errors);
  }
}

/**
 * Formats Zod validation errors into a user-friendly format
 * @param error - Zod validation error
 * @returns Record of field names to error messages
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const details: Record<string, string> = {};
  
  error.issues.forEach((err: z.ZodIssue) => {
    const path = err.path.join('.');
    details[path] = err.message;
  });

  return details;
}

/**
 * Formats validation error for HTTP response
 * @param error - CountryValidationError instance
 * @returns Formatted error response object
 */
export function formatValidationErrorResponse(error: CountryValidationError): ValidationError {
  return {
    error: error.message,
    details: error.details
  };
}

/**
 * Safe validation function that returns validation result instead of throwing
 * @param data - Data to validate
 * @param validator - Validation function to use
 * @returns Object with success flag and error details if validation fails
 */
export function safeValidate(
  data: unknown, 
  validator: (data: unknown) => void
): { success: true } | { success: false; error: ValidationError } {
  try {
    validator(data);
    return { success: true };
  } catch (error) {
    if (error instanceof CountryValidationError) {
      return {
        success: false,
        error: formatValidationErrorResponse(error)
      };
    }
    return {
      success: false,
      error: {
        error: "Internal validation error",
        details: { general: "An unexpected error occurred during validation" }
      }
    };
  }
}