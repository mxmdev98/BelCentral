// src/pages/Houses.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { housesApi, villagesApi, clansApi } from "../api";
import type { House, Village, Clan } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Houses() {
  const { can, isAdmin } = useAuth();
  const { push } = useToast();
  const [houses, setHouses] = useState<House[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [clanFilter, setClanFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showDelete, setShowDelete] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([housesApi.list(), villagesApi.list(), clansApi.list()])
      .then(([h, v, c]) => {
        setHouses(h.items);
        setVillages(v.items);
        setClans(c.items);
      })
      .catch(() => push("error", "Failed to load houses"))
      .finally(() => setLoading(false));
  }, [push]);

  const filtered = houses.filter((h) => {
    if (search) {
      const s = search.toLowerCase();
      if (!h.owner_name.toLowerCase().includes(s) && !h.village_name?.toLowerCase().includes(s)) return false;
    }
    if (villageFilter && h.village_id !== Number(villageFilter)) return false;
    if (clanFilter && h.clan_id !== Number(clanFilter)) return false;
    if (typeFilter && h.house_type !== typeFilter) return false;
    return true;
  });

  async function handleDelete(id: number) {
    try {
      await housesApi.remove(id);
      setHouses((prev) => prev.filter((h) => h.id !== id));
      push("success", "House record deleted");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Houses</h1>
        {can("houses", "create") && (
          <Link to="/houses/new" className="btn-primary">+ New house</Link>
        )}
      </div>

      <div className="card">
        <div className="card-body space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Search</label>
              <input
                className="input"
                placeholder="Owner or village name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Village</label>
              <select className="input" value={villageFilter} onChange={(e) => setVillageFilter(e.target.value)}>
                <option value="">All</option>
                {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Clan</label>
              <select className="input" value={clanFilter} onChange={(e) => setClanFilter(e.target.value)}>
                <option value="">All</option>
                {clans.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All</option>
                <option value="Permanent">Permanent</option>
                <option value="Semi-Permanent">Semi-Permanent</option>
                <option value="Bush Material">Bush Material</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Village</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Purpose</th>
                <th className="px-4 py-3 font-semibold">Houses</th>
                <th className="px-4 py-3 font-semibold">Comments</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/houses/${h.id}`} className="font-medium text-brand-700 hover:underline">
                      {h.owner_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{h.village_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      h.house_type === "Permanent" ? "bg-green-100 text-green-800" :
                      h.house_type === "Semi-Permanent" ? "bg-yellow-100 text-yellow-800" :
                      "bg-orange-100 text-orange-800"
                    }`}>
                      {h.house_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{h.house_purpose}</td>
                  <td className="px-4 py-3 font-semibold">{h.num_houses}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{h.comments || "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {can("houses", "update") && (
                      <Link to={`/houses/${h.id}/edit`} className="text-brand-700 hover:underline mr-3">Edit</Link>
                    )}
                    {isAdmin && (
                      <button onClick={() => setShowDelete(h.id)} className="text-red-600 hover:underline">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No houses found.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete !== null}
        title="Delete house record?"
        message="This will permanently remove the house record."
        confirmLabel="Delete"
        onConfirm={() => showDelete && handleDelete(showDelete)}
        onCancel={() => setShowDelete(null)}
      />
    </div>
  );
}
