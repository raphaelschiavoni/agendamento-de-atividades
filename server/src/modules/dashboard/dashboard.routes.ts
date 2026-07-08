import { Router } from "express";
import { asyncRoute } from "../../middleware/error-handler.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import * as controller from "./dashboard.controller.js";

export const adminDashboardRouter = Router();
adminDashboardRouter.use(requireAdmin);
adminDashboardRouter.get("/summary", asyncRoute(controller.getSummary));
