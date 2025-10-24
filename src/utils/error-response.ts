import type { Context } from 'hono';

/**
 * Error Response Utilities
 * Provides consistent error response formatting across all endpoints
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

export interface ErrorResponse {
  error: string;
  details?: string | Record<string, string>;
}

export interface ValidationErrorDetails {
  [field: string]: string;
}

/**
 * Create a standardized error response
 * Requirements: 10.1, 10.2, 10.3, 10.4 - consistent JSON error format
 */
export function createErrorResponse(
  message: string,
  details?: string | Record<string, string>
): ErrorResponse {
  const response: ErrorResponse = { error: message };
  
  if (details) {
    response.details = details;
  }
  
  return response;
}

/**
 * Send a 404 Not Found response
 * Requirements: 10.1 - HTTP 404 format with "Country not found"
 */
export function sendNotFoundError(c: Context, message: string = "Country not found"): Response {
  return c.json(createErrorResponse(message), 404);
}

/**
 * Send a 400 Bad Request response for validation errors
 * Requirements: 10.2 - HTTP 400 format with "Validation failed"
 */
export function sendValidationError(
  c: Context, 
  details?: ValidationErrorDetails | string
): Response {
  return c.json(createErrorResponse("Validation failed", details), 400);
}

/**
 * Send a 500 Internal Server Error response
 * Requirements: 10.3 - HTTP 500 format with "Internal server error"
 */
export function sendInternalServerError(c: Context): Response {
  return c.json(createErrorResponse("Internal server error"), 500);
}

/**
 * Send a 503 Service Unavailable response for external API failures
 * Requirements: 10.4 - HTTP 503 format with error and details fields
 */
export function sendServiceUnavailableError(
  c: Context, 
  details: string
): Response {
  return c.json(
    createErrorResponse("External data source unavailable", details), 
    503
  );
}

/**
 * Error response utility class for consistent error handling
 */
export class ErrorResponseUtil {
  /**
   * Handle different types of errors and return appropriate responses
   */
  static handleError(c: Context, error: unknown): Response {
    console.error('Error occurred:', error);
    
    // Handle known error types
    if (error instanceof Error) {
      // Check for specific error types that should return 503
      if (error.name === 'ExternalAPIError' || error.message.includes('External')) {
        return sendServiceUnavailableError(c, error.message);
      }
      
      // Check for validation errors
      if (error.name === 'ValidationError' || error.message.includes('validation')) {
        return sendValidationError(c, error.message);
      }
      
      // Check for not found errors
      if (error.message.includes('not found') || error.message.includes('Not found')) {
        return sendNotFoundError(c, error.message);
      }
    }
    
    // Default to internal server error
    return sendInternalServerError(c);
  }
}