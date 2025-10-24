# Database Setup Guide

## Prerequisites

- MySQL 8.0 or higher
- Node.js 18+ with pnpm

## Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your MySQL database credentials:
```env
MYSQLHOST=localhost
MYSQLPORT=3306
MYSQLUSER=your_username
MYSQLPASSWORD=your_password
MYSQLDATABASE=countries_db
```

## Database Setup

1. Create the database in MySQL:
```sql
CREATE DATABASE countries_db;
```

2. Run the database migrations:
```bash
pnpm migrate
```

This will create the following tables:
- `countries`: Stores country data with exchange rates and GDP estimates
- `system_status`: Tracks system statistics and last refresh timestamp

## Database Schema

### Countries Table
- `id`: Auto-increment primary key
- `name`: Country name (unique)
- `capital`: Capital city
- `region`: Geographic region
- `population`: Population count
- `currency_code`: Primary currency code
- `exchange_rate`: USD exchange rate
- `estimated_gdp`: Calculated GDP estimate
- `flag_url`: Country flag image URL
- `last_refreshed_at`: Last data refresh timestamp
- `created_at`: Record creation timestamp

### System Status Table
- `id`: Fixed value (1)
- `last_refreshed_at`: Last system refresh timestamp
- `total_countries`: Total number of countries in database

## Manual Migration

If you prefer to run migrations manually, execute the SQL files in order:

1. `src/migrations/001_create_countries_table.sql`
2. `src/migrations/002_create_system_status_table.sql`