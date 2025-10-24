import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ErrorResponseUtil, sendInternalServerError, sendValidationError } from '../utils/error-response.js';

/**
 * Error Handling Middleware
 * Provides global error handling for unhandled exceptions and request validation
 * Requirements: 7.2, 7.3, 10.3
 */

/**
 * Global error handling middleware for unhandled exceptions
 * Requirements: 7.2, 10.3 - implement global error handling for unhandled exceptions
 */
export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error('Unhandled error caught by middleware:', error);
    
    // Handle Hono HTTPException
    if (error instanceof HTTPException) {
      return c.json(
        { 
          error: error.message || 'HTTP Error',
          details: error.cause ? String(error.cause) : undefined
        },
        error.status
      );
    }
    
    // Use error response utility for consistent handling
    return ErrorResponseUtil.handleError(c, error);
  }
}

/**
 * Request validation middleware
 * Requirements: 7.3 - add request validation middleware
 */
export function validateRequest() {
  return async (c: Context, next: Next) => {
    try {
      // Validate content type for POST/PUT requests
      const method = c.req.method;
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        const contentType = c.req.header('content-type');
        
        if (contentType && !contentType.includes('application/json')) {
          return sendValidationError(c, 'Content-Type must be application/json');
        }
      }
      
      // Validate request body size (basic check)
      try {
        const body = await c.req.text();
        if (body.length > 1024 * 1024) { // 1MB limit
          return sendValidationError(c, 'Request body too large');
        }
      } catch (error) {
        // Body might not be available or already consumed, continue
      }
      
      await next();
    } catch (error) {
      console.error('Request validation error:', error);
      return sendValidationError(c, 'Invalid request format');
    }
  };
}

/**
 * Parameter validation middleware for route parameters
 * Requirements: 7.3 - validate route parameters
 */
export function validateParams(paramName: string, validator?: (value: string) => boolean) {
  return async (c: Context, next: Next) => {
    try {
      const paramValue = c.req.param(paramName);
      
      if (!paramValue) {
        return sendValidationError(c, {
          [paramName]: `${paramName} parameter is required`
        });
      }
      
      // Apply custom validator if provided
      if (validator && !validator(paramValue)) {
        return sendValidationError(c, {
          [paramName]: `Invalid ${paramName} format`
        });
      }
      
      await next();
    } catch (error) {
      console.error(`Parameter validation error for ${paramName}:`, error);
      return sendValidationError(c, `Invalid ${paramName} parameter`);
    }
  };
}

/**
 * Query parameter validation middleware
 * Requirements: 7.3 - validate query parameters
 */
export function validateQuery(allowedParams: string[]) {
  return async (c: Context, next: Next) => {
    try {
      const queryParams = c.req.query();
      const providedParams = Object.keys(queryParams);
      
      // Check for unknown parameters
      const unknownParams = providedParams.filter(param => !allowedParams.includes(param));
      
      if (unknownParams.length > 0) {
        return sendValidationError(c, {
          query: `Unknown query parameters: ${unknownParams.join(', ')}`
        });
      }
      
      await next();
    } catch (error) {
      console.error('Query validation error:', error);
      return sendValidationError(c, 'Invalid query parameters');
    }
  };
}

/**
 * Rate limiting middleware (basic implementation)
 * Requirements: 7.2 - additional error handling for system protection
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return async (c: Context, next: Next) => {
    try {
      const clientId = c.req.header('x-forwarded-for') || 
                      c.req.header('x-real-ip') || 
                      'unknown';
      
      const now = Date.now();
      const clientData = requests.get(clientId);
      
      if (!clientData || now > clientData.resetTime) {
        // Reset or initialize
        requests.set(clientId, {
          count: 1,
          resetTime: now + windowMs
        });
      } else {
        clientData.count++;
        
        if (clientData.count > maxRequests) {
          return c.json(
            { 
              error: 'Too many requests',
              details: 'Rate limit exceeded. Please try again later.'
            },
            429
          );
        }
      }
      
      await next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      return sendInternalServerError(c);
    }
  };
}