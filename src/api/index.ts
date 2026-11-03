// src/api/index.ts — typed wrappers for each resource.
import { api } from "./client";
import type {
  AuthUser, Village, Tribe, Clan,
  Resident, ResidentDetail, PaginatedResidents, ResidentSearchParams,
  ReportResult, ReportType,
} from "../types";

// ---- auth ----
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ user: AuthUser }>("/auth/login", { username, password }),
  logout: () => api.post<{ ok: boolean }>("/auth/logout"),
  me: () => api.get<{ user: AuthUser }>("/auth/me"),
};

// ---- villages ----
export const villagesApi = {
  list: () => api.get<{ items: Village[] }>("/villages"),
  get: (id: number) => api.get<Village>(`/villages/${id}`),
  create: (name: string) => api.post<Village>("/villages", { name }),
  update: (id: number, name: string) => api.put<Village>(`/villages/${id}`, { name }),
  delete: (id: number) => api.del<void>(`/villages/${id}`),
};

// ---- tribes ----
export const tribesApi = {
  list: (villageId?: number) =>
    api.get<{ items: Tribe[] }>(`/tribes${villageId ? `?village_id=${villageId}` : ""}`),
  get: (id: number) => api.get<Tribe>(`/tribes/${id}`),
  create: (village_id: number, name: string) => api.post<Tribe>("/tribes", { village_id, name }),
  update: (id: number, village_id: number, name: string) =>
    api.put<Tribe>(`/tribes/${id}`, { village_id, name }),
  delete: (id: number) => api.del<void>(`/tribes/${id}`),
};

// ---- clans ----
export const clansApi = {
  list: (tribeId?: number) =>
    api.get<{ items: Clan[] }>(`/clans${tribeId ? `?tribe_id=${tribeId}` : ""}`),
  get: (id: number) => api.get<Clan>(`/clans/${id}`),
  create: (tribe_id: number, name: string) => api.post<Clan>("/clans", { tribe_id, name }),
  update: (id: number, tribe_id: number, name: string) =>
    api.put<Clan>(`/clans/${id}`, { tribe_id, name }),
  delete: (id: number) => api.del<void>(`/clans/${id}`),
};

// ---- residents ----
function buildQuery(params: ResidentSearchParams): string {
  const q = new URLSearchParams();
  (Object.keys(params) as (keyof ResidentSearchParams)[]).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const residentsApi = {
  list: (params: ResidentSearchParams) =>
    api.get<PaginatedResidents>(`/residents${buildQuery(params)}`),
  get: (id: string) => api.get<ResidentDetail>(`/residents/${id}`),
  create: (body: Omit<Resident, "id" | "age" | "created_by" | "created_at" | "updated_at" | "deleted_at">) =>
    api.post<ResidentDetail>("/residents", body),
  update: (id: string, body: Omit<Resident, "id" | "age" | "created_by" | "created_at" | "updated_at" | "deleted_at">) =>
    api.put<ResidentDetail>(`/residents/${id}`, body),
  remove: (id: string) => api.del<void>(`/residents/${id}`),
};

// ---- reports ----
export const reportsApi = {
  get: (type: ReportType) => api.get<ReportResult>(`/reports/${type}`),
};
