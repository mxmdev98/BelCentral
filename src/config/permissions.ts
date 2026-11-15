// src/config/permissions.ts
// =============================================================================
// SINGLE SOURCE OF TRUTH for all resources in the app.
//
// When you add a new table/register (e.g. houses, marriages, tenants):
//   1. Add the resource name to the backend's RESOURCES array
//      (backend/src/services/permissions.ts)
//   2. Add an entry to ALL_RESOURCES below
//   3. Add a `can_X` API function to frontend/src/api/index.ts
//   4. Create the page components
//   5. Add the route in App.tsx
//
// The nav bar, route guards, and dashboard cards all read from ALL_RESOURCES,
// so they automatically pick up new entries without any other changes.
// =============================================================================

export interface ResourceConfig {
  /** The resource name used in the database + API (e.g. "residents") */
  key: string;
  /** Human-readable label for the nav bar + dashboard card */
  label: string;
  /** The route path for the list page (e.g. "/residents") */
  path: string;
  /** Whether to show this resource on the dashboard as a count card */
  showOnDashboard: boolean;
  /** Logical group for the permission matrix (Population vs Land register). */
  group: "population" | "land";
}

// All resources in the app. Add new ones at the end.
// Order here = order in the nav bar.
export const ALL_RESOURCES: ResourceConfig[] = [
  // ---- Population register (people + vital events) ----
  { key: "residents",        label: "Residents",   path: "/residents",        showOnDashboard: true, group: "population" },
  { key: "ward_officials",   label: "Officials",   path: "/ward-officials",   showOnDashboard: true, group: "population" },
  { key: "disabled_persons", label: "Disabled",    path: "/disabled-persons", showOnDashboard: true, group: "population" },
  { key: "deaths",           label: "Deaths",      path: "/deaths",           showOnDashboard: true, group: "population" },
  { key: "births",           label: "Births",      path: "/births",           showOnDashboard: true, group: "population" },
  { key: "marriages",        label: "Marriages",   path: "/marriages",        showOnDashboard: true, group: "population" },
  { key: "people_movement",  label: "Movement",    path: "/people-movement",  showOnDashboard: true, group: "population" },
  // ---- Land register (property, tenancy, infrastructure, services) ----
  { key: "houses",           label: "Houses",      path: "/houses",           showOnDashboard: true, group: "land" },
  { key: "tenants",          label: "Tenants",     path: "/tenants",          showOnDashboard: true, group: "land" },
  { key: "projects",         label: "Projects",    path: "/projects",         showOnDashboard: true, group: "land" },
  { key: "schools",          label: "Schools",     path: "/schools",          showOnDashboard: true, group: "land" },
];

// Helper: get all resource keys (for the permission matrix in Admin page)
export const ALL_RESOURCE_KEYS = ALL_RESOURCES.map((r) => r.key);

// Helper: resource keys for a given group (used by the grouped permission matrix).
export const resourceKeysByGroup = (group: "population" | "land") =>
  ALL_RESOURCES.filter((r) => r.group === group).map((r) => r.key);

// The "reports" resource is a separate permission (view reports), not a
// register table. It is granted as its own matrix row group.
// It is READ-ONLY — only the Read checkbox is meaningful and shown; create
// and update are never persisted on the backend.
export const REPORTS_RESOURCE = {
  key: "reports",
  label: "Reports",
};

// Resources that only support the `read` action. The admin permission matrix
// hides the Create/Update columns for these, and the backend clamps them to
// false on upsert. Mirrors backend READONLY_RESOURCES.
export const READONLY_RESOURCES = new Set<string>([REPORTS_RESOURCE.key]);

// Every resource that can carry a permission — register tables PLUS the
// read-only "reports" resource. AuthContext uses this (not ALL_RESOURCE_KEYS)
// to build the permission map, so can("reports", "read") actually resolves for
// officials instead of always being false.
export const ALL_PERMISSIONED_KEYS: string[] = [
  ...ALL_RESOURCE_KEYS,
  REPORTS_RESOURCE.key,
];
