import type { Context } from 'hono';
import { readFileSync } from 'fs';
import { ImageGenerationService } from '../services/image-generation.service.js';
import { CountryService } from '../services/country.service.js';
import { SystemStatusService } from '../services/system-status.service.js';
import { ExternalAPIError } from '../services/external-api.service.js';
import { countryFiltersSchema } from '../models/country.schema.js';
import { 
  sendNotFoundError, 
  sendValidationError, 
  sendInternalServerError, 
  sendServiceUnavailableError,
  ErrorResponseUtil 
} from '../utils/error-response.js';

/**
 * Countries Controller
 * Handles HTTP requests for country-related operations
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.3, 6.4, 9.1, 9.2, 9.3, 9.4
 */

export class CountriesController {
  private imageGenerationService: ImageGenerationService;
  private countryService: CountryService;
  private systemStatusService: SystemStatusService;

  constructor() {
    this.imageGenerationService = new ImageGenerationService();
    this.countryService = new CountryService();
    this.systemStatusService = new SystemStatusService();
  }

  /**
   * Refresh countries data from external APIs
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4
   */
  async refreshCountries(c: Context): Promise<Response> {
    try {
      // Orchestrate external API calls, data processing, and database updates
      // Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
      const result = await this.countryService.refreshCountries();

      if (!result.success) {
        // Requirements: 9.1, 9.2, 9.3 - handle external API failures
        return sendServiceUnavailableError(c, result.errors.join('; '));
      }

      // Generate summary image after successful refresh
      // Requirements: 6.1, 6.2 - generate Summary_Image after refresh
      try {
        await this.imageGenerationService.generateSummaryImage();
      } catch (imageError) {
        console.warn('Failed to generate summary image:', imageError);
        // Don't fail the entire refresh operation for image generation issues
      }

      return c.json({
        message: "Countries data refreshed successfully",
        processed: result.processed,
        errors: result.errors.length > 0 ? result.errors : undefined
      }, 200);

    } catch (error) {
      console.error('Error refreshing countries:', error);

      // Requirements: 9.1, 9.2, 9.3, 9.4 - handle external API failures with specific error responses
      if (error instanceof ExternalAPIError) {
        return sendServiceUnavailableError(c, error.message);
      }

      // Requirements: 10.3 - consistent error format for internal server errors
      return sendInternalServerError(c);
    }
  }

  /**
   * Get all countries with optional filtering and sorting
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  async getCountries(c: Context): Promise<Response> {
    try {
      // Parse and validate query parameters
      const queryParams = c.req.query();
      
      // Validate filters using schema
      const filtersResult = countryFiltersSchema.safeParse({
        region: queryParams.region,
        currency: queryParams.currency,
        sort: queryParams.sort
      });

      if (!filtersResult.success) {
        // Requirements: 7.2, 10.2 - validation error handling
        const fieldErrors = filtersResult.error.flatten().fieldErrors;
        const validationDetails: Record<string, string> = {};
        
        // Convert Zod field errors to our expected format
        for (const [field, errors] of Object.entries(fieldErrors)) {
          if (errors && errors.length > 0) {
            validationDetails[field] = Array.isArray(errors) ? errors[0] : errors;
          }
        }
        
        return sendValidationError(c, validationDetails);
      }

      // Requirements: 2.1, 2.2, 2.3, 2.4 - get countries with filtering and sorting
      const countries = await this.countryService.getAllCountries(filtersResult.data);

      // Requirements: 2.5 - return all country fields in JSON format
      return c.json(countries, 200);

    } catch (error) {
      console.error('Error getting countries:', error);
      // Requirements: 10.3 - consistent error format
      return sendInternalServerError(c);
    }
  }

  /**
   * Get single country by name
   * Requirements: 3.1, 3.2, 3.3
   */
  async getCountryByName(c: Context): Promise<Response> {
    try {
      const name = c.req.param('name');
      
      if (!name) {
        // Requirements: 7.2, 10.2 - validation error handling
        return sendValidationError(c, { name: "Country name is required" });
      }

      // Requirements: 3.1 - return country matching provided name
      const country = await this.countryService.getCountryByName(name);

      if (!country) {
        // Requirements: 3.3, 10.1 - handle not found scenarios
        return sendNotFoundError(c);
      }

      // Requirements: 3.2 - return HTTP 200 with complete country data
      return c.json(country, 200);

    } catch (error) {
      console.error('Error getting country by name:', error);
      // Requirements: 10.3 - consistent error format
      return sendInternalServerError(c);
    }
  }

  /**
   * Delete country by name
   * Requirements: 4.1, 4.2, 4.3
   */
  async deleteCountryByName(c: Context): Promise<Response> {
    try {
      const name = c.req.param('name');
      
      if (!name) {
        // Requirements: 7.2, 10.2 - validation error handling
        return sendValidationError(c, { name: "Country name is required" });
      }

      // Requirements: 4.1 - remove country record matching provided name
      const deleted = await this.countryService.deleteCountryByName(name);

      if (!deleted) {
        // Requirements: 4.3, 10.1 - handle not found scenarios
        return sendNotFoundError(c);
      }

      // Requirements: 4.2 - return HTTP 200 for successful deletion
      return c.json(
        { message: "Country deleted successfully" },
        200
      );

    } catch (error) {
      console.error('Error deleting country:', error);
      // Requirements: 10.3 - consistent error format
      return sendInternalServerError(c);
    }
  }

  /**
   * Get system status
   * Requirements: 5.1, 5.2, 5.3
   */
  async getSystemStatus(c: Context): Promise<Response> {
    try {
      // Requirements: 5.1, 5.2 - return total_countries and last_refreshed_at
      const status = await this.countryService.getSystemStatus();

      // Requirements: 5.3 - format response as JSON
      return c.json(status, 200);

    } catch (error) {
      console.error('Error getting system status:', error);
      // Requirements: 10.3 - consistent error format
      return sendInternalServerError(c);
    }
  }

  /**
   * Serve summary image
   * Requirements: 6.3, 6.4 - serve Summary_Image file and handle missing image scenarios
   */
  async getSummaryImage(c: Context): Promise<Response> {
    try {
      // Check if image exists
      // Requirements: 6.4 - handle missing image scenarios
      if (!this.imageGenerationService.summaryImageExists()) {
        return sendNotFoundError(c, "Summary image not found");
      }

      // Serve the image file
      // Requirements: 6.3 - serve the Summary_Image file
      const imagePath = this.imageGenerationService.getSummaryImagePath();
      const imageBuffer = readFileSync(imagePath);

      return new Response(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': imageBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      });

    } catch (error) {
      console.error('Error serving summary image:', error);
      return sendInternalServerError(c);
    }
  }
}