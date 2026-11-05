// src/types/index.ts — shared TS types for the frontend.
// Mirrors the backend shapes.

export type Role = "official" | "admin";

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
}

// Client-side permission flags for the logged-in user.
// Admins always have all flags true.
export interface UserPermissions {
  residents: { read: boolean; create: boolean; update: boolean };
  ward_officials: { read: boolean; create: boolean; update: boolean };
  [key: string]: { read: boolean; create: boolean; update: boolean };
}

export interface Village {
  id: number;
  name: string;
  created_at: string;
  tribe_count?: number;
  resident_count?: number;
}

export interface Tribe {
  id: number;
  village_id: number;
  name: string;
  created_at: string;
}

export interface Clan {
  id: number;
  tribe_id: number;
  name: string;
  created_at: string;
}

export type Gender = "Male" | "Female";
export type EmploymentStatus =
  | "Employed" | "Unemployed" | "Student" | "Retired" | "Self-Employed";
export type MaritalStatus =
  | "Single" | "Married" | "Widowed" | "Divorced" | "Separated";
export type EducationLevel =
  | "None" | "Primary" | "Secondary" | "Vocational" | "Tertiary";

export interface Resident {
  id: string;
  full_name: string;
  father_name: string;
  mother_name: string;
  gender: Gender;
  date_of_birth: string; // YYYY-MM-DD
  age: number;
  village_id: number;
  tribe_id: number;
  clan_id: number;
  employment_status: EmploymentStatus;
  marital_status: MaritalStatus;
  education_level: EducationLevel;
  profession: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ResidentDetail extends Resident {
  village_name: string;
  tribe_name: string;
  clan_name: string;
}

export interface ResidentListRow extends Resident {
  village_name: string;
  tribe_name: string;
  clan_name: string;
}

export interface PaginatedResidents {
  items: ResidentListRow[];
  total: number;
  page: number;
  limit: number;
}

export interface ResidentSearchParams {
  q?: string;
  father?: string;
  mother?: string;
  village_id?: number;
  tribe_id?: number;
  clan_id?: number;
  gender?: Gender;
  employment_status?: EmploymentStatus;
  marital_status?: MaritalStatus;
  education_level?: EducationLevel;
  page?: number;
  limit?: number;
}

export type ReportType =
  | "residents_per_village"
  | "gender_per_village"
  | "by_tribe_and_clan"
  | "by_employment"
  | "by_marital"
  | "by_education"
  | "age_distribution";

export interface ReportRow {
  label: string;
  sublabel?: string;
  count: number;
}
export interface ReportResult {
  type: ReportType;
  columns: string[];
  rows: ReportRow[];
}

// ---- Ward Officials ----
export interface WardOfficial {
  id: number;
  surname: string;
  given_name: string;
  gender: Gender;
  date_of_birth: string | null;
  official_type: string;
  position_status: string;
  village_id: number | null;
  village_name: string | null;
  phone: string | null;
  email: string | null;
  appointed_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Users & permissions (admin) ----
export type UserRole = "official" | "admin";

export interface User {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserPermission {
  id: number;
  user_id: number;
  resource: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithPermissions extends User {
  permissions: UserPermission[];
}

// Standard API error shape (mirrors backend errorHandler).
export interface ApiError {
  error: string;
  details?: Record<string, string>;
}
