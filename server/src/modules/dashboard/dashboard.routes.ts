import { Router } from "express";
import { asyncRoute } from "../../middleware/error-handler.js";
import { requireAdmin, requireAdminRole } from "../auth/auth.middleware.js";
import * as controller from "./dashboard.controller.js";

export const adminDashboardRouter = Router();
adminDashboardRouter.use(requireAdmin, requireAdminRole);
adminDashboardRouter.get("/summary", asyncRoute(controller.getSummary));
