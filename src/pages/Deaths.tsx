// src/pages/Deaths.tsx  (plural filename)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deathApi, villagesApi } from "../api";
import type { Death, Village } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Deaths() {
  const { can, isAdmin } = useAuth();
  const { push } = useToast();
  const [items, setItems] = useState<Death[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [showDelete, setShowDelete] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([deathApi.list(), villagesApi.list()])
      .then(([list, v]) => {
        setItems(list.items);
        setVillages(v.items);
      })
      .catch(() => push("error", "Failed to load death records"))
      .finally(() => setLoading(false));
  }, [push]);

  const filtered = items.filter((item) => {
    if (search) {
      const s = search.toLowerCase();
      const hay = [item.given_names, item.surname, item.cause_of_death].join(" ").toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (villageFilter && item.village_id !== Number(villageFilter)) return false;
    return true;
  });

  async function handleDelete(id: number) {
    try {
      await deathApi.remove(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      push("success", "Death record deleted");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Deaths</h1>
        {can("deaths", "create") && (
          <Link to="/deaths/new" className="btn-primary">+ New death</Link>
        )}
      </div>

      <div className="card">
        <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Search</label>
            <input
              className="input"
              placeholder="Search death records…"
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
                <th className="px-4 py-3 font-semibold">Village</th>
                <th className="px-4 py-3 font-semibold">Clan</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/deaths/${item.id}`} className="font-medium text-brand-700 hover:underline">
                      {item.given_names}
                    </Link>
                    <div className="text-xs text-slate-500">{`${item.surname || '—'} · ${item.cause_of_death || '—'}`}</div>
                  </td>
                  <td className="px-4 py-3">{item.village_name || "—"}</td>
                  <td className="px-4 py-3">{item.clan_name || "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {can("deaths", "update") && (
                      <Link to={`/deaths/${item.id}/edit`} className="text-brand-700 hover:underline mr-3">Edit</Link>
                    )}
                    {isAdmin && (
                      <button onClick={() => setShowDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">No death records found.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete !== null}
        title="Delete death record?"
        message="This will permanently remove the record."
        confirmLabel="Delete"
        onConfirm={() => showDelete && handleDelete(showDelete)}
        onCancel={() => setShowDelete(null)}
      />
    </div>
  );
}
