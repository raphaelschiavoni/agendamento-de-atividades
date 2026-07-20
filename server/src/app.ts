import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

import { hotelsRouter, adminHotelsRouter } from "./modules/hotels/hotels.routes.js";
import { activitiesRouter, adminActivitiesRouter } from "./modules/activities/activities.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { adminUsersRouter } from "./modules/auth/users.routes.js";
import { adminOccupancyRouter } from "./modules/availability/occupancy.routes.js";
import { checkoutRouter, vouchersRouter, adminBookingsRouter } from "./modules/bookings/bookings.routes.js";
import { adminDashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { adminAnalyticsRouter } from "./modules/analytics/analytics.routes.js";
import { adminWhatsappLogRouter } from "./modules/notifications/whatsapp-log.routes.js";
import { adminUploadsRouter } from "./modules/uploads/uploads.routes.js";

const PgSession = connectPgSimple(session);

export function createApp() {
  mkdirSync(env.UPLOADS_DIR, { recursive: true });

  const app = express();

  // Behind EasyPanel's reverse proxy (Traefik) the app receives HTTPS via X-Forwarded-*
  // headers; trust the first proxy so secure cookies and req.protocol work correctly.
  if (env.isProd) app.set("trust proxy", 1);

  // Accept both the configured CLIENT_ORIGIN and its localhost/127.0.0.1 equivalent,
  // since browsers may resolve "localhost" to either depending on the machine.
  const clientOriginAlt = env.CLIENT_ORIGIN.includes("localhost")
    ? env.CLIENT_ORIGIN.replace("localhost", "127.0.0.1")
    : env.CLIENT_ORIGIN.replace("127.0.0.1", "localhost");
  const allowedOrigins = new Set([env.CLIENT_ORIGIN, clientOriginAlt]);
  app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.has(origin)), credentials: true }));
  app.use(express.json());
  app.use(requestLogger);
  app.use("/uploads", express.static(env.UPLOADS_DIR));

  app.use(
    session({
      store: new PgSession({ pool, tableName: "session", createTableIfMissing: true }),
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: env.isProd, // HTTPS-only cookie in production (served behind TLS)
        maxAge: 8 * 60 * 60 * 1000,
      },
    })
  );

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/hotels", hotelsRouter);
  app.use("/api/activities", activitiesRouter);
  app.use("/api/checkout", checkoutRouter);
  app.use("/api/vouchers", vouchersRouter);

  app.use("/api/admin/hotels", adminHotelsRouter);
  app.use("/api/admin/activities", adminActivitiesRouter);
  app.use("/api/admin/bookings", adminBookingsRouter);
  app.use("/api/admin/dashboard", adminDashboardRouter);
  app.use("/api/admin/analytics", adminAnalyticsRouter);
  app.use("/api/admin/whatsapp-log", adminWhatsappLogRouter);
  app.use("/api/admin/uploads", adminUploadsRouter);
  app.use("/api/admin/users", adminUsersRouter);
  app.use("/api/admin/occupancy", adminOccupancyRouter);

  // Serve the built front-end (client/dist) from the same origin in production.
  // This makes /api same-origin (no CORS/proxy needed) and lets EasyPanel run a
  // single container. Any non-API GET falls back to index.html for client routing.
  if (existsSync(env.STATIC_DIR)) {
    app.use(express.static(env.STATIC_DIR));
    app.get(/^(?!\/api|\/uploads|\/health).*/, (_req, res) => {
      res.sendFile(path.join(env.STATIC_DIR, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
