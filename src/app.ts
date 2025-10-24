import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { logger } from "hono/logger";
import countriesRoutes from "./routes/countries.route.ts";
import { errorHandler } from "./middleware/error-handler.js";

const app = new Hono();

// Global middleware
app.use("*", cors());
app.use("*", prettyJSON());
app.use("*", logger());

// Global error handling middleware - Requirements: 7.2, 10.3
app.use("*", errorHandler);

app.get("/", (c) => {
  return c.json({
    status: 200,
    message: "Welcome to Country Currency API!",
  });
});

app.route("/countries", countriesRoutes);

// Status endpoint - Requirements: 5.1, 5.2, 5.3
app.get("/status", async (c) => {
  const { CountriesController } = await import("./controllers/countries.controller.js");
  const controller = new CountriesController();
  return controller.getSystemStatus(c);
});

export default app;
