// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { reportsApi, villagesApi } from "../api";
import type { ReportResult, Village } from "../types";
import { useAuth } from "../context/AuthContext";

interface Totals {
  totalResidents: number;
  totalVillages: number;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [totals, setTotals] = useState<Totals | null>(null);
  const [perVillage, setPerVillage] = useState<ReportResult | null>(null);
  const [ageDist, setAgeDist] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      villagesApi.list(),
      reportsApi.get("residents_per_village"),
      reportsApi.get("age_distribution"),
    ]).then(([v, pv, age]) => {
      setTotals({
        totalVillages: v.items.length,
        totalResidents: pv.rows.reduce((s, r) => s + r.count, 0),
      });
      setPerVillage(pv);
      setAgeDist(age);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading dashboard…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.username}</h1>
        <p className="text-sm text-slate-500">
          You are signed in as {isAdmin ? "an administrator" : "a ward official"}.
        </p>
      </div>

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Total residents" value={totals?.totalResidents ?? 0} />
        <StatCard label="Villages" value={totals?.totalVillages ?? 0} />
        <Link to="/residents" className="card hover:shadow-md transition">
          <div className="card-body">
            <div className="text-xs uppercase text-slate-500">Quick action</div>
            <div className="text-lg font-semibold mt-1 text-brand-700">Search residents →</div>
          </div>
        </Link>
      </div>

      {/* Two-column reports */}
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

      <div className="card">
        <div className="card-body flex flex-wrap gap-3">
          <Link to="/residents/new" className="btn-primary">+ New resident</Link>
          <Link to="/residents" className="btn-secondary">Search & filter</Link>
          <Link to="/reports" className="btn-secondary">View reports</Link>
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
