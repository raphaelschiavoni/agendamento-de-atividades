import { api } from "./client";
import type { AdminRole, AdminUser } from "../types";

export const listUsers = () => api.get<AdminUser[]>("/admin/users");

export const createUser = (input: {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  hotelId?: string | null;
}) => api.post<AdminUser>("/admin/users", input);

export const deleteUser = (id: string) => api.del<void>(`/admin/users/${id}`);
