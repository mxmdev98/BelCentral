// src/components/RequirePermission.tsx
// Wraps a page to ensure the user has read permission for the given resource.
// If they don't, shows a "no access" message instead of the page content.
// This prevents the page from mounting and making API calls the user isn't
// allowed to make.
import { useAuth } from "../context/AuthContext";

interface Props {
  resource: string;
  children: React.ReactNode;
}

export default function RequirePermission({ resource, children }: Props) {
  const { can, loading } = useAuth();

  if (loading) {
    return <div className="text-slate-500">Loading…</div>;
  }

  if (!can(resource, "read")) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Access denied</h2>
            <p className="text-sm text-slate-500">
              You do not have permission to view this page.
              Contact your administrator if you believe this is an error.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
