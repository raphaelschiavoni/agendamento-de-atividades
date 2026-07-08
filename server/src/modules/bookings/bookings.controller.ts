import type { Request, Response } from "express";
import { HttpError } from "../../middleware/error-handler.js";
import * as service from "./bookings.service.js";
import * as repo from "./bookings.repository.js";

export async function createCharge(req: Request, res: Response) {
  const { cart, customer } = req.body ?? {};
  if (!Array.isArray(cart) || !customer) throw new HttpError(400, "Corpo inválido: 'cart' e 'customer' são obrigatórios");
  const result = await service.createChargeFromCart(cart, customer);
  res.status(201).json(result);
}

export async function getCharge(req: Request, res: Response) {
  const result = await service.getChargeStatus(req.params.id);
  res.json(result);
}

export async function simulateApprove(req: Request, res: Response) {
  const bookings = await service.finalizeBookingsFromCharge(req.params.id);
  res.json({ bookings });
}

export async function getVoucher(req: Request, res: Response) {
  const booking = await repo.getBookingByVoucherCode(req.params.code);
  if (!booking) throw new HttpError(404, "Voucher não encontrado");
  res.json(service.toBookingDTO(booking));
}

// ---- admin ----

export async function listBookingsAdmin(req: Request, res: Response) {
  const bookings = await repo.listBookings({
    hotelId: typeof req.query.hotelId === "string" ? req.query.hotelId : undefined,
    status: typeof req.query.status === "string" ? (req.query.status as any) : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  });
  res.json(bookings.map(service.toBookingDTO));
}

export async function markUsedAdmin(req: Request, res: Response) {
  const booking = await repo.markBookingUsed(req.params.id);
  if (!booking) throw new HttpError(404, "Reserva não encontrada");
  res.json(service.toBookingDTO(booking));
}

export async function cancelBookingAdmin(req: Request, res: Response) {
  const booking = await repo.cancelBooking(req.params.id);
  if (!booking) throw new HttpError(404, "Reserva não encontrada");
  res.json(service.toBookingDTO(booking));
}
