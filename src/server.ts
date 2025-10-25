import { serve } from "@hono/node-server";
import { customLogger } from "./utils/logger.js";
import { initializeDatabase, runMigrations, closeDatabase } from "./services/db.service.js";

const port = Number(process.env.PORT) || 3000;

// Initialize database and run migrations before importing app
(async () => {
  try {
    initializeDatabase();
    console.log('Database connection initialized');
    await runMigrations();
  } catch (error) {
    console.error('Failed to initialize and migrate database:', error);
    process.exit(1);
  }
})();

// Import app after database initialization
const { default: app } = await import("./app.js");

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server is running on port ${info.port}`);
});

process.on("SIGINT", async () => {
  console.log('Shutting down server...');
  server.close();
  await closeDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log('Shutting down server...');
  server.close(async (error) => {
    if (error) {
      customLogger(error, "SIGTERM");
    }
    await closeDatabase();
    process.exit(error ? 1 : 0);
  });
});
