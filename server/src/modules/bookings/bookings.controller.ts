import type { Request, Response } from "express";
import { HttpError } from "../../middleware/error-handler.js";
import * as service from "./bookings.service.js";
import * as repo from "./bookings.repository.js";
import { recordAudit } from "../audit/audit.service.js";
import { scopedHotelId } from "../auth/auth.service.js";

function bookingLabel(b: { voucherCode: string; activityName: string; date: string; time: string }): string {
  return `${b.voucherCode} — ${b.activityName} (${b.date} ${b.time})`;
}

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

/** Usuário vinculado a 1 hotel (admin de hotel ou sala) só enxerga esse hotel; master vê todos. */
function effectiveHotelFilter(req: Request, requested?: string): string | undefined {
  return scopedHotelId(req.adminUser!) ?? requested;
}

/** Garante que usuário travado em 1 hotel só atue em reservas do próprio hotel. */
async function assertBookingAccess(req: Request, bookingId: string) {
  const scoped = scopedHotelId(req.adminUser!);
  if (!scoped) return;
  const booking = await repo.getBookingById(bookingId);
  if (!booking) throw new HttpError(404, "Reserva não encontrada");
  if (booking.hotel_id !== scoped) {
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
  await recordAudit(req, {
    action: "booking.approve", entityType: "booking", entityId: dto.id, hotelId: dto.hotelId,
    summary: `Aprovou a reserva ${bookingLabel(dto)}`,
  });
  res.json(dto);
}

export async function editBookingAdmin(req: Request, res: Response) {
  await assertBookingAccess(req, req.params.id);
  const { date, time, adults, children } = req.body ?? {};
  if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new HttpError(400, "Data inválida");
  if (time !== undefined && !/^\d{2}:\d{2}/.test(String(time))) throw new HttpError(400, "Horário inválido");
  const antes = await repo.getBookingById(req.params.id);
  const dto = await service.editBooking(req.params.id, {
    date,
    time,
    adults: adults !== undefined ? Number(adults) : undefined,
    children: children !== undefined ? Number(children) : undefined,
  });
  await recordAudit(req, {
    action: "booking.edit", entityType: "booking", entityId: dto.id, hotelId: dto.hotelId,
    summary: `Editou a reserva ${bookingLabel(dto)}`,
    details: antes
      ? { de: { data: antes.booking_date, hora: String(antes.booking_time).slice(0, 5), pessoas: antes.qty }, para: { data: dto.date, hora: dto.time, pessoas: dto.qty } }
      : {},
  });
  res.json(dto);
}

export async function markUsedAdmin(req: Request, res: Response) {
  await assertBookingAccess(req, req.params.id);
  const booking = await repo.markBookingUsed(req.params.id);
  if (!booking) throw new HttpError(404, "Reserva não encontrada");
  const dto = service.toBookingDTO(booking);
  await recordAudit(req, {
    action: "booking.mark_used", entityType: "booking", entityId: dto.id, hotelId: dto.hotelId,
    summary: `Marcou como utilizado ${bookingLabel(dto)}`,
  });
  res.json(dto);
}

export async function cancelBookingAdmin(req: Request, res: Response) {
  await assertBookingAccess(req, req.params.id);
  const booking = await repo.cancelBooking(req.params.id);
  if (!booking) throw new HttpError(404, "Reserva não encontrada");
  const dto = service.toBookingDTO(booking);
  await recordAudit(req, {
    action: "booking.cancel", entityType: "booking", entityId: dto.id, hotelId: dto.hotelId,
    summary: `Cancelou a reserva ${bookingLabel(dto)}`,
  });
  res.json(dto);
}
