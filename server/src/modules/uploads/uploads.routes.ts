import { Router } from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { readdir, stat } from "node:fs/promises";
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

const IMG_RE = /\.(jpe?g|png|webp|avif|gif)$/i;

export const adminUploadsRouter = Router();
adminUploadsRouter.use(requireAdmin);

// Lista as fotos já enviadas (biblioteca de mídia), mais recentes primeiro.
adminUploadsRouter.get(
  "/",
  asyncRoute(async (_req, res) => {
    let files: string[] = [];
    try {
      files = await readdir(env.UPLOADS_DIR);
    } catch {
      files = [];
    }
    const images = files.filter((f) => IMG_RE.test(f));
    const withTime = await Promise.all(
      images.map(async (f) => {
        try {
          const s = await stat(path.join(env.UPLOADS_DIR, f));
          return { url: `/uploads/${f}`, mtime: s.mtimeMs };
        } catch {
          return { url: `/uploads/${f}`, mtime: 0 };
        }
      })
    );
    withTime.sort((a, b) => b.mtime - a.mtime);
    res.json(withTime.map((x) => ({ url: x.url })));
  })
);

adminUploadsRouter.post(
  "/",
  upload.single("photo"),
  asyncRoute(async (req, res) => {
    if (!req.file) throw new HttpError(400, "Nenhum arquivo de imagem enviado");
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  })
);
