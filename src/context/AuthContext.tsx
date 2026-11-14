// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi, permissionsApi } from "../api";
import type { AuthUser } from "../types";
import { ALL_RESOURCE_KEYS } from "../config/permissions";

// A complete permission map for the logged-in user.
// Every resource in ALL_RESOURCE_KEYS has an entry (no undefined lookups).
// Admins always have all true. Officials have only what's been granted.
export type PermMap = Record<string, { read: boolean; create: boolean; update: boolean }>;

function fullPerms(): PermMap {
  const m: PermMap = {};
  for (const key of ALL_RESOURCE_KEYS) {
    m[key] = { read: true, create: true, update: true };
  }
  return m;
}

function emptyPerms(): PermMap {
  const m: PermMap = {};
  for (const key of ALL_RESOURCE_KEYS) {
    m[key] = { read: false, create: false, update: false };
  }
  return m;
}

// Convert a permissions API response into a PermMap
function permsFromResponse(wp: {
  role: string;
  permissions: { resource: string; can_read: boolean; can_create: boolean; can_update: boolean }[];
}): PermMap {
  if (wp.role === "admin") return fullPerms();
  const m = emptyPerms();
  for (const perm of wp.permissions) {
    if (m[perm.resource]) {
      m[perm.resource] = {
        read: perm.can_read,
        create: perm.can_create,
        update: perm.can_update,
      };
    }
  }
  return m;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  // Permission helper — always true for admin; for officials, reflects granted perms.
  // Returns false for unknown resources (defensive).
  can: (resource: string, action: "read" | "create" | "update") => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [perms, setPerms] = useState<PermMap | null>(null);
  const [loading, setLoading] = useState(true);

  // On initial load: check if already logged in (cookie), then fetch perms
  useEffect(() => {
    authApi
      .me()
      .then((r) => {
        setUser(r.user);
        return permissionsApi.getMine();
      })
      .then((wp) => {
        setPerms(permsFromResponse(wp));
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const r = await authApi.login(username, password);
    setUser(r.user);
    try {
      const wp = await permissionsApi.getMine();
      setPerms(permsFromResponse(wp));
    } catch {
      setPerms(emptyPerms());
    }
  }

  async function logout() {
    await authApi.logout();
    setUser(null);
    setPerms(null);
  }

  function can(resource: string, action: "read" | "create" | "update"): boolean {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (!perms || !perms[resource]) return false;
    return perms[resource][action];
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === "admin", can }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
