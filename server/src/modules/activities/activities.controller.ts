import type { Request, Response } from "express";
import { HttpError } from "../../middleware/error-handler.js";
import * as repo from "./activities.repository.js";
import { getAvailabilityForDate } from "../availability/availability.service.js";
import { recordAudit } from "../audit/audit.service.js";

export async function listAllActivities(_req: Request, res: Response) {
  const activities = await repo.listAllActive();
  res.json(activities);
}

export async function getActivity(req: Request, res: Response) {
  const activity = await repo.getActivityById(req.params.id);
  if (!activity) throw new HttpError(404, "Atividade não encontrada");
  res.json(activity);
}

const VALID_CATEGORIES = new Set(["hospede", "visitante", "dayuse", "passaporte"]);

export async function getActivityAvailability(req: Request, res: Response) {
  const date = String(req.query.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "Parâmetro 'date' inválido (use YYYY-MM-DD)");
  const category = typeof req.query.category === "string" && VALID_CATEGORIES.has(req.query.category)
    ? req.query.category
    : undefined;
  const activity = await repo.getActivityById(req.params.id);
  if (!activity) throw new HttpError(404, "Atividade não encontrada");
  const times = await getAvailabilityForDate(activity.id, date, category, { hideExpired: true });
  res.json({ date, times });
}

// ---- admin ----

export async function listActivitiesAdmin(req: Request, res: Response) {
  const hotelId = String(req.query.hotelId ?? "");
  if (!hotelId) throw new HttpError(400, "Parâmetro 'hotelId' é obrigatório");
  const activities = await repo.listActivitiesForHotel(hotelId, { onlyActive: false });
  res.json(activities);
}

export async function createActivityAdmin(req: Request, res: Response) {
  const activity = await repo.createActivity(req.body);
  await recordAudit(req, {
    action: "activity.create", entityType: "activity", entityId: activity.id, hotelId: activity.hotelId,
    summary: `Criou a atividade "${activity.name}"`,
  });
  res.status(201).json(activity);
}

export async function updateActivityAdmin(req: Request, res: Response) {
  const activity = await repo.updateActivity(req.params.id, req.body);
  if (!activity) throw new HttpError(404, "Atividade não encontrada");
  await recordAudit(req, {
    action: "activity.update", entityType: "activity", entityId: activity.id, hotelId: activity.hotelId,
    summary: `Editou a atividade "${activity.name}"`,
  });
  res.json(activity);
}

export async function toggleActivityAdmin(req: Request, res: Response) {
  const activity = await repo.toggleActivityActive(req.params.id, Boolean(req.body.active));
  if (!activity) throw new HttpError(404, "Atividade não encontrada");
  await recordAudit(req, {
    action: "activity.toggle", entityType: "activity", entityId: activity.id, hotelId: activity.hotelId,
    summary: `${activity.active ? "Ativou" : "Desativou"} a atividade "${activity.name}"`,
  });
  res.json(activity);
}

export async function deleteActivityAdmin(req: Request, res: Response) {
  const antes = await repo.getActivityById(req.params.id);
  const ok = await repo.deleteActivity(req.params.id);
  if (!ok) throw new HttpError(404, "Atividade não encontrada");
  await recordAudit(req, {
    action: "activity.delete", entityType: "activity", entityId: req.params.id, hotelId: antes?.hotelId ?? null,
    summary: `Excluiu a atividade "${antes?.name ?? req.params.id}"`,
  });
  res.status(204).send();
}
