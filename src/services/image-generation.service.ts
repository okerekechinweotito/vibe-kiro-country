import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { CountryRepository } from './country-repository.service.js';
import { SystemStatusService } from './system-status.service.js';
import type { Country } from '../models/country.schema.js';

/**
 * Image Generation Service
 * Handles creation and serving of summary images for country statistics
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

export class ImageGenerationService {
  private countryRepository: CountryRepository;
  private systemStatusService: SystemStatusService;
  private cacheDir: string;

  constructor() {
    this.countryRepository = new CountryRepository();
    this.systemStatusService = new SystemStatusService();
    this.cacheDir = join(process.cwd(), process.env.CACHE_DIR || 'cache');
  }

  /**
   * Generate summary image with country statistics
   * Requirements: 6.1, 6.2 - generate image with total countries, top 5 by GDP, and timestamp
   */
  async generateSummaryImage(): Promise<void> {
    try {
      // Get system status for total countries and timestamp
      const systemStatus = await this.systemStatusService.getSystemStatus();
      
      // Get top 5 countries by GDP
      const topCountries = await this.countryRepository.findCountries({
        sort: 'gdp_desc'
      });
      const top5Countries = topCountries.slice(0, 5);

      // Create canvas
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext('2d');

      // Generate the image
      this.drawSummaryImage(ctx, systemStatus.total_countries, top5Countries, systemStatus.last_refreshed_at);

      // Ensure cache directory exists
      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true });
      }

      // Save to cache/summary.png
      // Requirements: 6.2 - save generated images to cache/summary.png
      const buffer = canvas.toBuffer('image/png');
      const imagePath = join(this.cacheDir, 'summary.png');
      writeFileSync(imagePath, buffer);

    } catch (error) {
      console.error('Failed to generate summary image:', error);
      throw new Error('Image generation failed');
    }
  }

  /**
   * Check if summary image exists
   * Requirements: 6.3, 6.4 - handle missing image scenarios
   */
  summaryImageExists(): boolean {
    const imagePath = join(this.cacheDir, 'summary.png');
    return existsSync(imagePath);
  }

  /**
   * Get path to summary image
   * Requirements: 6.3 - serve the Summary_Image file
   */
  getSummaryImagePath(): string {
    return join(this.cacheDir, 'summary.png');
  }

  /**
   * Draw the summary image content on canvas
   * Requirements: 6.1 - generate image with total countries, top 5 by GDP, and timestamp
   */
  private drawSummaryImage(
    ctx: CanvasRenderingContext2D, 
    totalCountries: number, 
    topCountries: Country[], 
    lastRefreshed: string
  ): void {
    // Set background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 800, 600);

    // Set title
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Country Statistics Summary', 400, 60);

    // Draw total countries
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#3498db';
    ctx.fillText(`Total Countries: ${totalCountries}`, 400, 120);

    // Draw top 5 countries header
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('Top 5 Countries by GDP', 400, 170);

    // Draw top 5 countries list
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    let yPosition = 210;

    topCountries.forEach((country, index) => {
      const gdpFormatted = country.estimated_gdp 
        ? `$${country.estimated_gdp.toLocaleString()}` 
        : 'N/A';
      
      ctx.fillStyle = '#34495e';
      ctx.fillText(
        `${index + 1}. ${country.name} - ${gdpFormatted}`,
        100,
        yPosition
      );
      yPosition += 30;
    });

    // Draw timestamp
    ctx.font = '14px Arial';
    ctx.fillStyle = '#7f8c8d';
    ctx.textAlign = 'center';
    const timestampText = lastRefreshed === 'Never' 
      ? 'Last Refreshed: Never' 
      : `Last Refreshed: ${new Date(lastRefreshed).toLocaleString()}`;
    ctx.fillText(timestampText, 400, 550);

    // Draw border
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 780, 580);
  }
}