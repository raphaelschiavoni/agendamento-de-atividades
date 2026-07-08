import { Router } from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { requireAdmin } from "../auth/auth.middleware.js";
import { HttpError, asyncRoute } from "../../middleware/error-handler.js";

const storage = multer.diskStorage({
  destination: env.UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\//.test(file.mimetype));
  },
});

export const adminUploadsRouter = Router();
adminUploadsRouter.use(requireAdmin);
adminUploadsRouter.post(
  "/",
  upload.single("photo"),
  asyncRoute(async (req, res) => {
    if (!req.file) throw new HttpError(400, "Nenhum arquivo de imagem enviado");
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  })
);
