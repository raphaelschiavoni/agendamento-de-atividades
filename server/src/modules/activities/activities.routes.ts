import { Router } from "express";
import { asyncRoute } from "../../middleware/error-handler.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import * as controller from "./activities.controller.js";

export const activitiesRouter = Router();
activitiesRouter.get("/", asyncRoute(controller.listAllActivities));
activitiesRouter.get("/:id", asyncRoute(controller.getActivity));
activitiesRouter.get("/:id/availability", asyncRoute(controller.getActivityAvailability));

export const adminActivitiesRouter = Router();
adminActivitiesRouter.use(requireAdmin);
adminActivitiesRouter.get("/", asyncRoute(controller.listActivitiesAdmin));
adminActivitiesRouter.post("/", asyncRoute(controller.createActivityAdmin));
adminActivitiesRouter.patch("/:id", asyncRoute(controller.updateActivityAdmin));
adminActivitiesRouter.patch("/:id/toggle-active", asyncRoute(controller.toggleActivityAdmin));
adminActivitiesRouter.delete("/:id", asyncRoute(controller.deleteActivityAdmin));
