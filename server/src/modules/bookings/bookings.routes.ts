import { Router } from "express";
import { asyncRoute } from "../../middleware/error-handler.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import * as controller from "./bookings.controller.js";

export const checkoutRouter = Router();
checkoutRouter.post("/charges", asyncRoute(controller.createCharge));
checkoutRouter.get("/charges/:id", asyncRoute(controller.getCharge));
checkoutRouter.post("/charges/:id/simulate-approve", asyncRoute(controller.simulateApprove));

export const vouchersRouter = Router();
vouchersRouter.get("/:code", asyncRoute(controller.getVoucher));

export const adminBookingsRouter = Router();
adminBookingsRouter.use(requireAdmin);
adminBookingsRouter.get("/", asyncRoute(controller.listBookingsAdmin));
adminBookingsRouter.patch("/:id/approve", asyncRoute(controller.approveBookingAdmin));
adminBookingsRouter.patch("/:id/mark-used", asyncRoute(controller.markUsedAdmin));
adminBookingsRouter.patch("/:id/cancel", asyncRoute(controller.cancelBookingAdmin));
