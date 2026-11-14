// src/api/index.ts — typed wrappers for each resource.
import { api } from "./client";
import type {
  AuthUser, Village, Tribe, Clan,
  Resident, ResidentDetail, PaginatedResidents, ResidentSearchParams,
  ReportResult, ReportType, WardOfficial,
  User, UserWithPermissions, House,
  DisabledPerson, Death, Birth, Marriage, Tenant, PersonMovement, Project, School,
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

// ---- ward officials ----
export const wardOfficialsApi = {
  list: (activeOnly = false) =>
    api.get<{ items: WardOfficial[] }>(`/ward-officials${activeOnly ? "?active=true" : ""}`),
  get: (id: number) => api.get<WardOfficial>(`/ward-officials/${id}`),
  create: (body: Partial<WardOfficial>) => api.post<WardOfficial>("/ward-officials", body),
  update: (id: number, body: Partial<WardOfficial>) => api.put<WardOfficial>(`/ward-officials/${id}`, body),
  remove: (id: number) => api.del<void>(`/ward-officials/${id}`),
};

// ---- users (admin) ----
export const usersApi = {
  list: () => api.get<{ items: User[] }>("/users"),
  create: (username: string, password: string, role: "official" | "admin") =>
    api.post<User>("/users", { username, password, role }),
  resetPassword: (id: number, password: string) =>
    api.put<{ ok: boolean }>(`/users/${id}/password`, { password }),
  toggleActive: (id: number, isActive: boolean) =>
    api.put<User>(`/users/${id}/active`, { is_active: isActive }),
  remove: (id: number) => api.del<void>(`/users/${id}`),
};

// ---- permissions (admin) ----
export const permissionsApi = {
  list: () => api.get<{ items: UserWithPermissions[] }>("/permissions"),
  get: (userId: number) => api.get<UserWithPermissions>(`/permissions/${userId}`),
  getMine: () => api.get<UserWithPermissions>("/permissions/me"),
  upsert: (userId: number, body: {
    resource: string; can_read: boolean; can_create: boolean; can_update: boolean;
  }) => api.put(`/permissions/${userId}`, body),
  remove: (userId: number, resource: string) => api.del<void>(`/permissions/${userId}/${resource}`),
};

// ---- houses ----
export const housesApi = {
  list: () => api.get<{ items: House[] }>("/houses"),
  get: (id: number) => api.get<House>(`/houses/${id}`),
  create: (body: Partial<House>) => api.post<House>("/houses", body),
  update: (id: number, body: Partial<House>) => api.put<House>(`/houses/${id}`, body),
  remove: (id: number) => api.del<void>(`/houses/${id}`),
};

// ---- disabled_persons ----
export const disabledPersonApi = {
  list: () => api.get<{ items: DisabledPerson[] }>("/disabled-persons"),
  get: (id: number) => api.get<DisabledPerson>(`/disabled-persons/${id}`),
  create: (body: Partial<DisabledPerson>) => api.post<DisabledPerson>("/disabled-persons", body),
  update: (id: number, body: Partial<DisabledPerson>) => api.put<DisabledPerson>(`/disabled-persons/${id}`, body),
  remove: (id: number) => api.del<void>(`/disabled-persons/${id}`),
};
// ---- deaths ----
export const deathApi = {
  list: () => api.get<{ items: Death[] }>("/deaths"),
  get: (id: number) => api.get<Death>(`/deaths/${id}`),
  create: (body: Partial<Death>) => api.post<Death>("/deaths", body),
  update: (id: number, body: Partial<Death>) => api.put<Death>(`/deaths/${id}`, body),
  remove: (id: number) => api.del<void>(`/deaths/${id}`),
};
// ---- births ----
export const birthApi = {
  list: () => api.get<{ items: Birth[] }>("/births"),
  get: (id: number) => api.get<Birth>(`/births/${id}`),
  create: (body: Partial<Birth>) => api.post<Birth>("/births", body),
  update: (id: number, body: Partial<Birth>) => api.put<Birth>(`/births/${id}`, body),
  remove: (id: number) => api.del<void>(`/births/${id}`),
};
// ---- marriages ----
export const marriageApi = {
  list: () => api.get<{ items: Marriage[] }>("/marriages"),
  get: (id: number) => api.get<Marriage>(`/marriages/${id}`),
  create: (body: Partial<Marriage>) => api.post<Marriage>("/marriages", body),
  update: (id: number, body: Partial<Marriage>) => api.put<Marriage>(`/marriages/${id}`, body),
  remove: (id: number) => api.del<void>(`/marriages/${id}`),
};
// ---- tenants ----
export const tenantApi = {
  list: () => api.get<{ items: Tenant[] }>("/tenants"),
  get: (id: number) => api.get<Tenant>(`/tenants/${id}`),
  create: (body: Partial<Tenant>) => api.post<Tenant>("/tenants", body),
  update: (id: number, body: Partial<Tenant>) => api.put<Tenant>(`/tenants/${id}`, body),
  remove: (id: number) => api.del<void>(`/tenants/${id}`),
};
// ---- people_movement ----
export const personMovementApi = {
  list: () => api.get<{ items: PersonMovement[] }>("/people-movement"),
  get: (id: number) => api.get<PersonMovement>(`/people-movement/${id}`),
  create: (body: Partial<PersonMovement>) => api.post<PersonMovement>("/people-movement", body),
  update: (id: number, body: Partial<PersonMovement>) => api.put<PersonMovement>(`/people-movement/${id}`, body),
  remove: (id: number) => api.del<void>(`/people-movement/${id}`),
};
// ---- projects ----
export const projectApi = {
  list: () => api.get<{ items: Project[] }>("/projects"),
  get: (id: number) => api.get<Project>(`/projects/${id}`),
  create: (body: Partial<Project>) => api.post<Project>("/projects", body),
  update: (id: number, body: Partial<Project>) => api.put<Project>(`/projects/${id}`, body),
  remove: (id: number) => api.del<void>(`/projects/${id}`),
};
// ---- schools ----
export const schoolApi = {
  list: () => api.get<{ items: School[] }>("/schools"),
  get: (id: number) => api.get<School>(`/schools/${id}`),
  create: (body: Partial<School>) => api.post<School>("/schools", body),
  update: (id: number, body: Partial<School>) => api.put<School>(`/schools/${id}`, body),
  remove: (id: number) => api.del<void>(`/schools/${id}`),
};


