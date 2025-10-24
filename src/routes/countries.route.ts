import { Hono } from 'hono';
import { CountriesController } from '../controllers/countries.controller.js';
import { validateParams, validateQuery } from '../middleware/error-handler.js';

/**
 * Countries Routes
 * Defines HTTP routes for country-related operations
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.3, 6.4, 9.1, 9.2, 9.3, 9.4
 */

const countriesRoutes = new Hono();

// Lazy instantiation of controller to avoid database initialization issues
function getController() {
  return new CountriesController();
}

// Refresh endpoint
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4 - POST /countries/refresh endpoint
countriesRoutes.post('/refresh', (c) => getController().refreshCountries(c));

// Country retrieval endpoints
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5 - GET /countries endpoint with filtering and sorting
countriesRoutes.get('/', 
  validateQuery(['region', 'currency', 'sort']),
  (c) => getController().getCountries(c)
);

// Image endpoint (must be before /:name to avoid route conflict)
// Requirements: 6.3, 6.4 - GET /countries/image endpoint for summary image
countriesRoutes.get('/image', (c) => getController().getSummaryImage(c));

// Requirements: 3.1, 3.2, 3.3 - GET /countries/:name endpoint for single country lookup
countriesRoutes.get('/:name', 
  validateParams('name', (name) => name.length > 0 && name.length <= 100),
  (c) => getController().getCountryByName(c)
);

// Country deletion endpoint
// Requirements: 4.1, 4.2, 4.3 - DELETE /countries/:name endpoint
countriesRoutes.delete('/:name', 
  validateParams('name', (name) => name.length > 0 && name.length <= 100),
  (c) => getController().deleteCountryByName(c)
);

export default countriesRoutes;