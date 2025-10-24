# Requirements Document

## Introduction

The Country Currency & Exchange API is a RESTful service that fetches country data from external APIs, processes currency exchange rates, computes economic estimates, and provides comprehensive CRUD operations with caching capabilities. The system integrates multiple data sources to create a unified country information service with real-time exchange rate data.

## Glossary

- **Country_API_System**: The RESTful API system that manages country and currency data
- **External_Countries_API**: The REST Countries API service (restcountries.com)
- **External_Exchange_API**: The Exchange Rates API service (open.er-api.com)
- **Database**: MySQL database for persistent storage
- **Cache**: Database-stored country and exchange rate data
- **Summary_Image**: Generated PNG image containing country statistics
- **Refresh_Operation**: Process of fetching and updating data from external APIs
- **Estimated_GDP**: Calculated economic indicator based on population and exchange rate

## Requirements

### Requirement 1

**User Story:** As an API consumer, I want to refresh country data from external sources, so that I have up-to-date country information and exchange rates.

#### Acceptance Criteria

1. WHEN a POST request is made to /countries/refresh, THE Country_API_System SHALL fetch country data from External_Countries_API with fields name, capital, region, population, flag, and currencies
2. WHEN country data is successfully fetched, THE Country_API_System SHALL extract the first currency code from each country's currencies array
3. WHEN currency codes are extracted, THE Country_API_System SHALL fetch exchange rates from External_Exchange_API using USD as base currency
4. WHEN exchange rates are obtained, THE Country_API_System SHALL calculate estimated_gdp using the formula: population × random(1000-2000) ÷ exchange_rate
5. WHEN all data is processed, THE Country_API_System SHALL store or update country records in Database using case-insensitive name matching

### Requirement 2

**User Story:** As an API consumer, I want to retrieve country data with filtering and sorting options, so that I can access specific country information efficiently.

#### Acceptance Criteria

1. WHEN a GET request is made to /countries, THE Country_API_System SHALL return all countries from Database in JSON format
2. WHERE region filter is provided, THE Country_API_System SHALL return only countries matching the specified region
3. WHERE currency filter is provided, THE Country_API_System SHALL return only countries with the specified currency_code
4. WHERE sort parameter is gdp_desc, THE Country_API_System SHALL return countries ordered by estimated_gdp in descending order
5. THE Country_API_System SHALL include all country fields: id, name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url, last_refreshed_at

### Requirement 3

**User Story:** As an API consumer, I want to retrieve individual country information by name, so that I can access specific country details.

#### Acceptance Criteria

1. WHEN a GET request is made to /countries/:name, THE Country_API_System SHALL return the country record matching the provided name
2. WHEN the country name exists in Database, THE Country_API_System SHALL return HTTP status 200 with complete country data
3. WHEN the country name does not exist in Database, THE Country_API_System SHALL return HTTP status 404 with error message "Country not found"

### Requirement 4

**User Story:** As an API consumer, I want to delete country records, so that I can manage the country data collection.

#### Acceptance Criteria

1. WHEN a DELETE request is made to /countries/:name, THE Country_API_System SHALL remove the country record matching the provided name
2. WHEN the country exists and is successfully deleted, THE Country_API_System SHALL return HTTP status 200
3. WHEN the country does not exist, THE Country_API_System SHALL return HTTP status 404 with error message "Country not found"

### Requirement 5

**User Story:** As an API consumer, I want to check system status, so that I can monitor data freshness and collection size.

#### Acceptance Criteria

1. WHEN a GET request is made to /status, THE Country_API_System SHALL return total_countries count from Database
2. WHEN status is requested, THE Country_API_System SHALL return last_refreshed_at timestamp from the most recent Refresh_Operation
3. THE Country_API_System SHALL format the response as JSON with total_countries and last_refreshed_at fields

### Requirement 6

**User Story:** As an API consumer, I want to access a visual summary of country data, so that I can view key statistics in image format.

#### Acceptance Criteria

1. WHEN a Refresh_Operation completes successfully, THE Country_API_System SHALL generate Summary_Image containing total countries, top 5 countries by estimated_gdp, and refresh timestamp
2. WHEN Summary_Image is generated, THE Country_API_System SHALL save the image to cache/summary.png on disk
3. WHEN a GET request is made to /countries/image, THE Country_API_System SHALL serve the Summary_Image file
4. WHEN Summary_Image does not exist, THE Country_API_System SHALL return HTTP status 404 with error message "Summary image not found"

### Requirement 7

**User Story:** As an API consumer, I want proper validation of country data, so that data integrity is maintained.

#### Acceptance Criteria

1. THE Country_API_System SHALL require name, population, and currency_code fields for country records
2. WHEN required fields are missing or invalid, THE Country_API_System SHALL return HTTP status 400 with validation error details
3. THE Country_API_System SHALL format validation errors as JSON with error field and details object containing field-specific messages

### Requirement 8

**User Story:** As an API consumer, I want proper handling of currency edge cases, so that countries with missing or multiple currencies are processed correctly.

#### Acceptance Criteria

1. WHEN a country has multiple currencies, THE Country_API_System SHALL store only the first currency code from the currencies array
2. WHEN a country has empty currencies array, THE Country_API_System SHALL set currency_code to null, exchange_rate to null, and estimated_gdp to 0
3. WHEN currency_code is not found in External_Exchange_API response, THE Country_API_System SHALL set exchange_rate to null and estimated_gdp to null
4. THE Country_API_System SHALL store country records even when currency data is incomplete

### Requirement 9

**User Story:** As an API consumer, I want reliable error handling for external API failures, so that system behavior is predictable during service outages.

#### Acceptance Criteria

1. WHEN External_Countries_API fails or times out, THE Country_API_System SHALL return HTTP status 503 with error message "External data source unavailable"
2. WHEN External_Exchange_API fails or times out, THE Country_API_System SHALL return HTTP status 503 with error message "External data source unavailable"
3. WHEN external API failure occurs during Refresh_Operation, THE Country_API_System SHALL not modify existing Database records
4. THE Country_API_System SHALL include details field specifying which API service failed

### Requirement 10

**User Story:** As an API consumer, I want consistent error response formats, so that error handling is predictable across all endpoints.

#### Acceptance Criteria

1. WHEN HTTP status 404 is returned, THE Country_API_System SHALL format response as JSON with error field containing "Country not found"
2. WHEN HTTP status 400 is returned, THE Country_API_System SHALL format response as JSON with error field containing "Validation failed"
3. WHEN HTTP status 500 is returned, THE Country_API_System SHALL format response as JSON with error field containing "Internal server error"
4. WHEN HTTP status 503 is returned, THE Country_API_System SHALL format response as JSON with error and details fields