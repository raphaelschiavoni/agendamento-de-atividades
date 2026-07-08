import { Router } from "express";
import { asyncRoute } from "../../middleware/error-handler.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import * as controller from "./hotels.controller.js";

export const hotelsRouter = Router();
hotelsRouter.get("/", asyncRoute(controller.listHotels));
hotelsRouter.get("/:id", asyncRoute(controller.getHotel));
hotelsRouter.get("/:id/activities", asyncRoute(controller.getHotelActivities));

export const adminHotelsRouter = Router();
adminHotelsRouter.use(requireAdmin);
adminHotelsRouter.get("/", asyncRoute(controller.listHotelsAdmin));
adminHotelsRouter.patch("/:id", asyncRoute(controller.updateHotelAdmin));
