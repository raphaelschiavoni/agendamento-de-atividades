import type { Request, Response } from "express";
import { HttpError } from "../../middleware/error-handler.js";
import * as hotelsRepo from "./hotels.repository.js";
import { listActivitiesForHotel } from "../activities/activities.repository.js";

export async function listHotels(_req: Request, res: Response) {
  const hotels = await hotelsRepo.listHotels(false);
  res.json(hotels);
}

export async function getHotel(req: Request, res: Response) {
  const hotel = await hotelsRepo.getHotelById(req.params.id, false);
  if (!hotel) throw new HttpError(404, "Hotel não encontrado");
  res.json(hotel);
}

export async function getHotelActivities(req: Request, res: Response) {
  const hotel = await hotelsRepo.getHotelById(req.params.id, false);
  if (!hotel) throw new HttpError(404, "Hotel não encontrado");
  const activities = await listActivitiesForHotel(req.params.id, { onlyActive: true });
  res.json(activities);
}

// ---- admin ----

export async function listHotelsAdmin(_req: Request, res: Response) {
  const hotels = await hotelsRepo.listHotels(true);
  res.json(hotels);
}

export async function updateHotelAdmin(req: Request, res: Response) {
  const updated = await hotelsRepo.updateHotel(req.params.id, req.body);
  if (!updated) throw new HttpError(404, "Hotel não encontrado");
  res.json(updated);
}
