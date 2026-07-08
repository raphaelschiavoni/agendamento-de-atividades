import { Router } from "express";
import { asyncRoute, HttpError } from "../../middleware/error-handler.js";
import * as authService from "./auth.service.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncRoute(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw new HttpError(400, "Email e senha são obrigatórios");
    const user = await authService.verifyCredentials(email, password);
    if (!user) throw new HttpError(401, "Email ou senha inválidos");
    req.session.adminUserId = user.id;
    res.json(user);
  })
);

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(204).send();
  });
});

authRouter.get(
  "/me",
  asyncRoute(async (req, res) => {
    if (!req.session.adminUserId) throw new HttpError(401, "Não autenticado");
    const user = await authService.getAdminUserById(req.session.adminUserId);
    if (!user) throw new HttpError(401, "Não autenticado");
    res.json(user);
  })
);
