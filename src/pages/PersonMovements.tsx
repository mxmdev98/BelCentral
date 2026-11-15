// src/pages/PersonMovements.tsx  (plural filename)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { personMovementApi, villagesApi } from "../api";
import type { PersonMovement, Village } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

export default function PersonMovements() {
  const { can, isAdmin } = useAuth();
  const { push } = useToast();
  const [items, setItems] = useState<PersonMovement[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [showDelete, setShowDelete] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([personMovementApi.list(), villagesApi.list()])
      .then(([list, v]) => {
        setItems(list.items);
        setVillages(v.items);
      })
      .catch(() => push("error", "Failed to load movement records"))
      .finally(() => setLoading(false));
  }, [push]);

  const filtered = items.filter((item) => {
    if (search) {
      const s = search.toLowerCase();
      const hay = [item.given_names, item.direction, item.location, item.movement_date].join(" ").toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (villageFilter && item.village_id !== Number(villageFilter)) return false;
    return true;
  });

  async function handleDelete(id: number) {
    try {
      await personMovementApi.remove(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      push("success", "Movement record deleted");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">People Movement</h1>
        {can("people_movement", "create") && (
          <Link to="/people-movement/new" className="btn-primary">+ New movement</Link>
        )}
      </div>

      <div className="card">
        <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Search</label>
            <input
              className="input"
              placeholder="Search movement records…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Village</label>
            <select className="input" value={villageFilter} onChange={(e) => setVillageFilter(e.target.value)}>
              <option value="">All villages</option>
              {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Direction</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Village</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/people-movement/${item.id}`} className="font-medium text-brand-700 hover:underline">
                      {item.given_names}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {item.direction ? (
                      <span className={`badge ${
                        item.direction === "arriving"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}>
                        {item.direction === "arriving" ? "Arriving" : "Leaving"}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">{item.location || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.movement_date || "—"}</td>
                  <td className="px-4 py-3">{item.village_name || "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {can("people_movement", "update") && (
                      <Link to={`/people-movement/${item.id}/edit`} className="text-brand-700 hover:underline mr-3">Edit</Link>
                    )}
                    {isAdmin && (
                      <button onClick={() => setShowDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No movement records found.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete !== null}
        title="Delete movement record?"
        message="This will permanently remove the record."
        confirmLabel="Delete"
        onConfirm={() => showDelete && handleDelete(showDelete)}
        onCancel={() => setShowDelete(null)}
      />
    </div>
  );
}
