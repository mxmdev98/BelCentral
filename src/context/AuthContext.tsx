// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi, permissionsApi } from "../api";
import type { AuthUser, UserPermissions } from "../types";

const FULL_PERMS: UserPermissions = {
  residents: { read: true, create: true, update: true },
  ward_officials: { read: true, create: true, update: true },
};

function emptyPerms(): UserPermissions {
  return {
    residents: { read: false, create: false, update: false },
    ward_officials: { read: false, create: false, update: false },
  };
}

// Convert a UserWithPermissions response into the UserPermissions shape
// used by the `can()` helper.
function permsFromResponse(wp: {
  role: string;
  permissions: { resource: string; can_read: boolean; can_create: boolean; can_update: boolean }[];
}): UserPermissions {
  if (wp.role === "admin") return FULL_PERMS;
  const p = emptyPerms();
  for (const perm of wp.permissions) {
    if (p[perm.resource]) {
      p[perm.resource] = {
        read: perm.can_read,
        create: perm.can_create,
        update: perm.can_update,
      };
    }
  }
  return p;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  can: (resource: string, action: "read" | "create" | "update") => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [perms, setPerms] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  // On initial load: check if already logged in (cookie), then fetch perms
  useEffect(() => {
    authApi
      .me()
      .then((r) => {
        setUser(r.user);
        // Fetch MY permissions (works for both admin and official)
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
    // Fetch MY permissions
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
