import { Router } from "express";
import { asyncRoute } from "../../middleware/error-handler.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import * as controller from "./analytics.controller.js";

export const adminAnalyticsRouter = Router();
adminAnalyticsRouter.use(requireAdmin);
adminAnalyticsRouter.get("/summary", asyncRoute(controller.getSummary));
adminAnalyticsRouter.get("/customers", asyncRoute(controller.getCustomers));
