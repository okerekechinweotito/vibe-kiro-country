# Country Currency & Exchange API

A RESTful API service that fetches country data from external APIs, processes currency exchange rates, computes economic estimates, and provides comprehensive CRUD operations with caching capabilities. Built with [Hono](https://hono.dev/) and TypeScript.

## Features

- 🌍 **Country Data Management**: Fetch and store comprehensive country information
- 💱 **Real-time Exchange Rates**: Integration with live currency exchange APIs
- 📊 **GDP Estimation**: Calculate estimated GDP using population and exchange rates
- 🖼️ **Visual Summaries**: Generate PNG images with country statistics
- 🔍 **Advanced Filtering**: Filter countries by region, currency, and sort by GDP
- 🗄️ **MySQL Integration**: Persistent storage with optimized queries
- ⚡ **High Performance**: Efficient caching and batch processing

## Getting Started

### Prerequisites

- **Node.js** (v20.11.17 or later)
- **pnpm** package manager
- **MySQL** (v8.0 or higher)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Configure your `.env` file:**
   ```env
   # Server Configuration
   PORT=3000

   # Database Configuration
   MYSQLHOST=localhost
   MYSQLPORT=3306
   MYSQLUSER=your_username
   MYSQLPASSWORD=your_password
   MYSQLDATABASE=countries_db

   # External API Configuration
   COUNTRIES_API_URL=https://restcountries.com/v3.1
   EXCHANGE_API_URL=https://open.er-api.com/v6
   API_TIMEOUT=10000

   # Cache Configuration
   CACHE_DIR=cache
   ```

4. **Set up the database:**
   ```bash
   # Create database in MySQL
   mysql -u your_username -p -e "CREATE DATABASE countries_db;"
   
   # Run migrations
   pnpm migrate
   ```

### Development

Start the development server:

```bash
pnpm run dev
```

The server will start on `http://localhost:3000`.

### Production

Build and start the production server:

```bash
pnpm run build
pnpm start
```

## API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication
No authentication required for this API.

---

### 🔄 Refresh Country Data

**`POST /countries/refresh`**

Fetches fresh country data from external APIs and updates the database.

**Response (200 OK):**
```json
{
  "message": "Countries data refreshed successfully",
  "processed": 195,
  "errors": []
}
```

**Error Responses:**
- `503 Service Unavailable`: External API unavailable
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/countries/refresh
```

---

### 🌍 Get All Countries

**`GET /countries`**

Retrieves all countries with optional filtering and sorting.

**Query Parameters:**
- `region` (string): Filter by region (e.g., "Europe", "Asia")
- `currency` (string): Filter by currency code (e.g., "USD", "EUR")
- `sort` (string): Sort order (`gdp_desc` for GDP descending)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "United States",
    "capital": "Washington, D.C.",
    "region": "Americas",
    "population": 331900000,
    "currency_code": "USD",
    "exchange_rate": 1.000000,
    "estimated_gdp": 497850000000.00,
    "flag_url": "https://flagcdn.com/w320/us.png",
    "last_refreshed_at": "2024-10-24T10:30:00.000Z"
  }
]
```

**Examples:**
```bash
# Get all countries
curl http://localhost:3000/countries

# Filter by region
curl http://localhost:3000/countries?region=Europe

# Filter by currency
curl http://localhost:3000/countries?currency=EUR

# Sort by GDP (descending)
curl http://localhost:3000/countries?sort=gdp_desc

# Combined filters
curl http://localhost:3000/countries?region=Asia&sort=gdp_desc
```

---

### 🏴 Get Country by Name

**`GET /countries/:name`**

Retrieves a specific country by name.

**Parameters:**
- `name` (string): Country name (case-insensitive)

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "United States",
  "capital": "Washington, D.C.",
  "region": "Americas",
  "population": 331900000,
  "currency_code": "USD",
  "exchange_rate": 1.000000,
  "estimated_gdp": 497850000000.00,
  "flag_url": "https://flagcdn.com/w320/us.png",
  "last_refreshed_at": "2024-10-24T10:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found`: Country not found

**Example:**
```bash
curl http://localhost:3000/countries/Japan
```

---

### 🗑️ Delete Country

**`DELETE /countries/:name`**

Deletes a country from the database.

**Parameters:**
- `name` (string): Country name to delete

**Response (200 OK):**
```json
{
  "message": "Country deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Country not found

**Example:**
```bash
curl -X DELETE http://localhost:3000/countries/TestCountry
```

---

### 📊 System Status

**`GET /status`**

Returns system statistics and health information.

**Response (200 OK):**
```json
{
  "total_countries": 195,
  "last_refreshed_at": "2024-10-24T10:30:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3000/status
```

---

### 🖼️ Summary Image

**`GET /countries/image`**

Returns a generated PNG image with country statistics.

**Response (200 OK):**
- Content-Type: `image/png`
- Returns PNG image with:
  - Total countries count
  - Top 5 countries by GDP
  - Last refresh timestamp

**Error Responses:**
- `404 Not Found`: Summary image not found

**Example:**
```bash
curl http://localhost:3000/countries/image -o summary.png
```

## Error Handling

All API endpoints return consistent error responses:

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### HTTP Status Codes
- `200 OK`: Successful operation
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: External service unavailable

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `MYSQLHOST` | MySQL host | `localhost` | Yes |
| `MYSQLPORT` | MySQL port | `3306` | Yes |
| `MYSQLUSER` | MySQL username | - | Yes |
| `MYSQLPASSWORD` | MySQL password | - | Yes |
| `MYSQLDATABASE` | MySQL database name | - | Yes |
| `COUNTRIES_API_URL` | REST Countries API URL | `https://restcountries.com/v3.1` | No |
| `EXCHANGE_API_URL` | Exchange Rates API URL | `https://open.er-api.com/v6` | No |
| `API_TIMEOUT` | External API timeout (ms) | `10000` | No |
| `CACHE_DIR` | Cache directory path | `cache` | No |

## Dependencies

### Production Dependencies
- **[hono](https://hono.dev/)**: Fast, lightweight web framework
- **[@hono/node-server](https://hono.dev/getting-started/nodejs)**: Node.js adapter for Hono
- **[@hono/zod-validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator)**: Request validation middleware
- **[mysql2](https://github.com/sidorares/node-mysql2)**: MySQL client for Node.js
- **[zod](https://zod.dev)**: TypeScript-first schema validation
- **[canvas](https://github.com/Automattic/node-canvas)**: Image generation library

### Development Dependencies
- **[typescript](https://www.typescriptlang.org/)**: TypeScript compiler
- **[tsx](https://github.com/esbuild-kit/tsx)**: TypeScript execution engine
- **[@types/node](https://www.npmjs.com/package/@types/node)**: Node.js type definitions

## Project Structure

```
/
├── .env.example              # Environment variables template
├── DATABASE_SETUP.md         # Database setup guide
├── README.md                 # This file
├── package.json              # Project configuration
├── tsconfig.json            # TypeScript configuration
├── cache/                   # Generated images cache
│   └── summary.png          # Country statistics image
└── src/
    ├── app.ts               # Hono application setup
    ├── server.ts            # Server entry point
    ├── controllers/         # HTTP request handlers
    │   └── countries.controller.ts
    ├── middleware/          # Custom middleware
    │   └── error-handler.ts
    ├── migrations/          # Database migrations
    │   ├── 001_create_countries_table.sql
    │   └── 002_create_system_status_table.sql
    ├── models/              # Data models and schemas
    │   └── country.schema.ts
    ├── routes/              # Route definitions
    │   └── countries.route.ts
    ├── scripts/             # Utility scripts
    │   └── migrate.ts
    ├── services/            # Business logic layer
    │   ├── country.service.ts
    │   ├── country-repository.service.ts
    │   ├── db.service.ts
    │   ├── external-api.service.ts
    │   ├── image-generation.service.ts
    │   └── system-status.service.ts
    └── utils/               # Utility functions
        ├── error-response.ts
        ├── logger.ts
        └── validation.ts
```

## Database Schema

### Countries Table
```sql
CREATE TABLE countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    capital VARCHAR(255),
    region VARCHAR(255),
    population BIGINT NOT NULL,
    currency_code VARCHAR(10),
    exchange_rate DECIMAL(15,6),
    estimated_gdp DECIMAL(20,2),
    flag_url TEXT,
    last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_region (region),
    INDEX idx_currency (currency_code),
    INDEX idx_gdp (estimated_gdp)
);
```

### System Status Table
```sql
CREATE TABLE system_status (
    id INT PRIMARY KEY DEFAULT 1,
    last_refreshed_at TIMESTAMP,
    total_countries INT DEFAULT 0,
    CHECK (id = 1)
);
```

## External APIs

This service integrates with the following external APIs:

### REST Countries API
- **URL**: https://restcountries.com/v3.1
- **Purpose**: Fetch country data (name, capital, region, population, flag, currencies)
- **Rate Limits**: No authentication required, reasonable usage expected

### Exchange Rates API
- **URL**: https://open.er-api.com/v6
- **Purpose**: Fetch real-time currency exchange rates
- **Rate Limits**: 1,500 requests/month (free tier)

## 🚀 Deployment

This project is optimized for deployment on Railway. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. Connect your GitHub repository
4. Add a MySQL database service
5. Railway will automatically build and deploy your API

The project includes:
- `railway.json` - Railway configuration
- `nixpacks.toml` - Build configuration with Canvas dependencies
- Automatic database migrations on deployment
- Production-ready environment variable setup

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the existing documentation
- Review the API examples above
