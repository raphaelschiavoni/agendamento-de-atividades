import { Router } from "express";
import { asyncRoute } from "../../middleware/error-handler.js";
import { requireAdmin, requireManage } from "../auth/auth.middleware.js";
import * as controller from "./hotels.controller.js";

export const hotelsRouter = Router();
hotelsRouter.get("/", asyncRoute(controller.listHotels));
hotelsRouter.get("/:id", asyncRoute(controller.getHotel));
hotelsRouter.get("/:id/activities", asyncRoute(controller.getHotelActivities));

export const adminHotelsRouter = Router();
adminHotelsRouter.use(requireAdmin);
adminHotelsRouter.get("/", asyncRoute(controller.listHotelsAdmin));
// Edição de hotel: master (qualquer) ou administrador do próprio hotel (checado no controller).
adminHotelsRouter.patch("/:id", requireManage, asyncRoute(controller.updateHotelAdmin));
