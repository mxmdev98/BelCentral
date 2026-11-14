// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { reportsApi, villagesApi, wardOfficialsApi, housesApi } from "../api";
import type { ReportResult } from "../types";
import { useAuth } from "../context/AuthContext";
import { ALL_RESOURCES } from "../config/permissions";

interface Totals {
  totalResidents: number;
  totalVillages: number;
  totalOfficials: number;
  activeOfficials: number;
  totalHouses: number;
  // Generic per-resource counts for everything else (keyed by resource key)
  counts: Record<string, number>;
}

export default function Dashboard() {
  const { user, isAdmin, can } = useAuth();
  const [totals, setTotals] = useState<Totals | null>(null);
  const [perVillage, setPerVillage] = useState<ReportResult | null>(null);
  const [ageDist, setAgeDist] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Build a list of promises ONLY for resources the user can read.
    // This avoids unnecessary API calls (and 403 errors) for resources
    // the user doesn't have permission to view.
    const promises: Promise<unknown>[] = [];

    const canSeeResidents = can("residents", "read");
    const canSeeOfficials = can("ward_officials", "read");
    const canSeeHouses = can("houses", "read");

    if (canSeeResidents) {
      promises.push(villagesApi.list());
      promises.push(reportsApi.get("residents_per_village"));
      promises.push(reportsApi.get("age_distribution"));
    }

    if (canSeeOfficials) {
      promises.push(wardOfficialsApi.list());
    }

    if (canSeeHouses) {
      promises.push(housesApi.list());
    }

    if (promises.length === 0) {
      setLoading(false);
      return;
    }

    Promise.all(promises)
      .then((results) => {
        let idx = 0;
        const newTotals: Totals = {
          totalResidents: 0,
          totalVillages: 0,
          totalOfficials: 0,
          activeOfficials: 0,
          totalHouses: 0,
          counts: {},
        };

        if (canSeeResidents) {
          const v = results[idx++] as { items: { id: number; name: string }[] };
          const pv = results[idx++] as ReportResult;
          const age = results[idx++] as ReportResult;
          newTotals.totalVillages = v.items.length;
          newTotals.totalResidents = pv.rows.reduce((s, r) => s + r.count, 0);
          setPerVillage(pv);
          setAgeDist(age);
        }

        if (canSeeOfficials) {
          const officials = results[idx++] as { items: { is_active: boolean }[] };
          newTotals.totalOfficials = officials.items.length;
          newTotals.activeOfficials = officials.items.filter((o) => o.is_active).length;
        }

        if (canSeeHouses) {
          const houses = results[idx++] as { items: { num_houses: number }[] };
          newTotals.totalHouses = houses.items.reduce((s, h) => s + h.num_houses, 0);
        }

        setTotals(newTotals);
      })
      .finally(() => setLoading(false));
  }, [can]);

  if (loading) return <div className="text-slate-500">Loading dashboard…</div>;

  // Filter resources to only those the user can read
  const visibleResources = ALL_RESOURCES.filter((r) => can(r.key, "read"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.username}</h1>
        <p className="text-sm text-slate-500">
          You are signed in as {isAdmin ? "an administrator" : "a ward official"}.
        </p>
      </div>

      {/* Quick stat cards — only show counts for resources the user can read */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {can("residents", "read") && (
          <StatCard label="Total residents" value={totals?.totalResidents ?? 0} />
        )}
        {can("residents", "read") && (
          <StatCard label="Villages" value={totals?.totalVillages ?? 0} />
        )}
        {can("ward_officials", "read") && (
          <Link to="/ward-officials" className="card hover:shadow-md transition">
            <div className="card-body">
              <div className="text-xs uppercase text-slate-500">Ward officials</div>
              <div className="text-3xl font-bold mt-1">{totals?.totalOfficials ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">
                {totals?.activeOfficials ?? 0} active
              </div>
            </div>
          </Link>
        )}
        {can("houses", "read") && (
          <Link to="/houses" className="card hover:shadow-md transition">
            <div className="card-body">
              <div className="text-xs uppercase text-slate-500">Houses</div>
              <div className="text-3xl font-bold mt-1">{totals?.totalHouses ?? 0}</div>
            </div>
          </Link>
        )}
        {visibleResources.length > 0 && (
          <Link to={visibleResources[0].path} className="card hover:shadow-md transition">
            <div className="card-body">
              <div className="text-xs uppercase text-slate-500">Quick action</div>
              <div className="text-lg font-semibold mt-1 text-brand-700">
                View {visibleResources[0].label} →
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Two-column reports — only show if user can read residents */}
      {can("residents", "read") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <div className="card-body">
              <h2 className="font-semibold mb-3">Residents per village</h2>
              {perVillage && perVillage.rows.length > 0 ? (
                <ul className="space-y-2">
                  {perVillage.rows.map((r) => (
                    <li key={r.label} className="flex justify-between text-sm">
                      <span className="text-slate-700">{r.label}</span>
                      <span className="font-semibold">{r.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No villages yet.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 className="font-semibold mb-3">Age distribution</h2>
              {ageDist && ageDist.rows.length > 0 ? (
                <ul className="space-y-2">
                  {ageDist.rows.map((r) => {
                    const max = Math.max(...ageDist.rows.map((x) => x.count), 1);
                    return (
                      <li key={r.label} className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-700">{r.label}</span>
                          <span className="font-semibold">{r.count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded mt-1 overflow-hidden">
                          <div
                            className="h-full bg-brand-500"
                            style={{ width: `${(r.count / max) * 100}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No residents yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All registers — quick links with create buttons for those with create permission */}
      <div className="card">
        <div className="card-body">
          <h2 className="font-semibold mb-3">Registers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_RESOURCES.map((r) => {
              const canRead = can(r.key, "read");
              const canCreate = can(r.key, "create");
              if (!canRead && !canCreate) return null;
              return (
                <div key={r.key} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                  <Link to={r.path} className="font-medium text-brand-700 hover:underline">
                    {r.label}
                  </Link>
                  {canCreate && (
                    <Link to={`${r.path}/new`} className="btn-secondary text-xs px-2 py-1">
                      + Add
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="text-xs uppercase text-slate-500">{label}</div>
        <div className="text-3xl font-bold mt-1">{value}</div>
      </div>
    </div>
  );
}
