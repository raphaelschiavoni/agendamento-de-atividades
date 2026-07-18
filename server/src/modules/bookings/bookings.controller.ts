import type { Request, Response } from "express";
import { HttpError } from "../../middleware/error-handler.js";
import * as service from "./bookings.service.js";
import * as repo from "./bookings.repository.js";

export async function createCharge(req: Request, res: Response) {
  const { cart, customer, guestHotelId, roomNumber } = req.body ?? {};
  if (!Array.isArray(cart) || !customer) throw new HttpError(400, "Corpo inválido: 'cart' e 'customer' são obrigatórios");
  const result = await service.createChargeFromCart(cart, customer, { guestHotelId, roomNumber });
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

// ---- admin / sala de agendamento ----

/** Sala de Agendamento enxerga apenas o hotel vinculado; ADM enxerga todos. */
function effectiveHotelFilter(req: Request, requested?: string): string | undefined {
  const user = req.adminUser!;
  if (user.role === "agendamento" && user.hotelId) return user.hotelId;
  return requested;
}

/** Garante que usuário de agendamento só atue em reservas do próprio hotel. */
async function assertBookingAccess(req: Request, bookingId: string) {
  const user = req.adminUser!;
  if (user.role !== "agendamento" || !user.hotelId) return;
  const booking = await repo.getBookingById(bookingId);
  if (!booking) throw new HttpError(404, "Reserva não encontrada");
  if (booking.hotel_id !== user.hotelId) {
    throw new HttpError(403, "Esta reserva pertence a outro hotel");
  }
}

export async function listBookingsAdmin(req: Request, res: Response) {
  const bookings = await repo.listBookings({
    hotelId: effectiveHotelFilter(req, typeof req.query.hotelId === "string" ? req.query.hotelId : undefined),
    status: typeof req.query.status === "string" ? (req.query.status as any) : undefined,
    approvalStatus:
      req.query.approvalStatus === "pendente" || req.query.approvalStatus === "aprovada"
        ? req.query.approvalStatus
        : undefined,
    date: typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date) ? req.query.date : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  });
  let dtos = bookings.map(service.toBookingDTO);
  if (req.query.withOccupancy === "1") dtos = await service.attachOccupancy(dtos);
  res.json(dtos);
}

export async function approveBookingAdmin(req: Request, res: Response) {
  await assertBookingAccess(req, req.params.id);
  const dto = await service.approveBookingAndNotify(req.params.id, req.adminUser!.id);
  res.json(dto);
}

export async function markUsedAdmin(req: Request, res: Response) {
  await assertBookingAccess(req, req.params.id);
  const booking = await repo.markBookingUsed(req.params.id);
  if (!booking) throw new HttpError(404, "Reserva não encontrada");
  res.json(service.toBookingDTO(booking));
}

export async function cancelBookingAdmin(req: Request, res: Response) {
  await assertBookingAccess(req, req.params.id);
  const booking = await repo.cancelBooking(req.params.id);
  if (!booking) throw new HttpError(404, "Reserva não encontrada");
  res.json(service.toBookingDTO(booking));
}
