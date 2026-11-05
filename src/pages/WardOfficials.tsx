// src/pages/WardOfficials.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { wardOfficialsApi, villagesApi } from "../api";
import type { WardOfficial, Village } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

export default function WardOfficials() {
  const { isAdmin, can } = useAuth();
  const { push } = useToast();
  const [officials, setOfficials] = useState<WardOfficial[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [showDelete, setShowDelete] = useState<number | null>(null);

  useEffect(() => {
    villagesApi.list().then((r) => setVillages(r.items));
  }, []);

  useEffect(() => {
    setLoading(true);
    wardOfficialsApi.list(activeOnly)
      .then((r) => setOfficials(r.items))
      .catch(() => push("error", "Failed to load ward officials"))
      .finally(() => setLoading(false));
  }, [activeOnly, push]);

  const filtered = officials.filter((o) => {
    if (search) {
      const s = search.toLowerCase();
      const matches =
        o.surname.toLowerCase().includes(s) ||
        o.given_name.toLowerCase().includes(s) ||
        o.official_type.toLowerCase().includes(s) ||
        o.position_status.toLowerCase().includes(s);
      if (!matches) return false;
    }
    if (villageFilter && o.village_id !== Number(villageFilter)) return false;
    return true;
  });

  async function handleDelete(id: number) {
    try {
      await wardOfficialsApi.remove(id);
      setOfficials((prev) => prev.filter((o) => o.id !== id));
      push("success", "Ward official deleted");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Ward Officials</h1>
        {can("ward_officials", "create") && (
          <Link to="/ward-officials/new" className="btn-primary">+ New official</Link>
        )}
      </div>

      <div className="card">
        <div className="card-body space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Search</label>
              <input
                className="input"
                placeholder="Name, type, or position"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Village</label>
              <select
                className="input"
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
              >
                <option value="">All</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="h-4 w-4"
                />
                Active only
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Gender</th>
                <th className="px-4 py-3 font-semibold">Official type</th>
                <th className="px-4 py-3 font-semibold">Position</th>
                <th className="px-4 py-3 font-semibold">Village</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/ward-officials/${o.id}`} className="font-medium text-brand-700 hover:underline">
                      {o.given_name} {o.surname}
                    </Link>
                    {o.date_of_birth && (
                      <div className="text-xs text-slate-500">DOB: {o.date_of_birth}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{o.gender}</td>
                  <td className="px-4 py-3">{o.official_type}</td>
                  <td className="px-4 py-3">{o.position_status}</td>
                  <td className="px-4 py-3">{o.village_name || "—"}</td>
                  <td className="px-4 py-3">
                    {o.is_active ? (
                      <span className="badge bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-600">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {can("ward_officials", "update") && (
                      <Link to={`/ward-officials/${o.id}/edit`} className="text-brand-700 hover:underline mr-3">
                        Edit
                      </Link>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setShowDelete(o.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No ward officials found.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete !== null}
        title="Delete ward official?"
        message="This will permanently remove the official from the register."
        confirmLabel="Delete"
        onConfirm={() => showDelete && handleDelete(showDelete)}
        onCancel={() => setShowDelete(null)}
      />
    </div>
  );
}
