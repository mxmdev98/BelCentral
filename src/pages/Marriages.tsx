// src/pages/Marriages.tsx  (plural filename)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { marriageApi, villagesApi } from "../api";
import type { Marriage, Village } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Marriages() {
  const { can, isAdmin } = useAuth();
  const { push } = useToast();
  const [items, setItems] = useState<Marriage[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [showDelete, setShowDelete] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([marriageApi.list(), villagesApi.list()])
      .then(([list, v]) => {
        setItems(list.items);
        setVillages(v.items);
      })
      .catch(() => push("error", "Failed to load marriage records"))
      .finally(() => setLoading(false));
  }, [push]);

  const filtered = items.filter((item) => {
    if (search) {
      const s = search.toLowerCase();
      const hay = [
        item.husband_surname, item.husband_given_names,
        item.wife_surname, item.wife_given_names,
        item.date_of_marriage, item.place_of_marriage,
      ].join(" ").toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (villageFilter && item.village_id !== Number(villageFilter)) return false;
    return true;
  });

  async function handleDelete(id: number) {
    try {
      await marriageApi.remove(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      push("success", "Marriage record deleted");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Marriages</h1>
        {can("marriages", "create") && (
          <Link to="/marriages/new" className="btn-primary">+ New marriage</Link>
        )}
      </div>

      <div className="card">
        <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Search</label>
            <input
              className="input"
              placeholder="Search marriage records…"
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
                <th className="px-4 py-3 font-semibold">Husband</th>
                <th className="px-4 py-3 font-semibold">Wife</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Place</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const husband = [item.husband_surname, item.husband_given_names].filter(Boolean).join(" ") || "—";
                const wife = [item.wife_surname, item.wife_given_names].filter(Boolean).join(" ") || "—";
                return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{husband}</td>
                  <td className="px-4 py-3">{wife}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.date_of_marriage || "—"}</td>
                  <td className="px-4 py-3">{item.place_of_marriage || "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link to={`/marriages/${item.id}`} className="btn-secondary text-xs px-2 py-1 mr-2">
                      View Details
                    </Link>
                    {can("marriages", "update") && (
                      <Link to={`/marriages/${item.id}/edit`} className="text-brand-700 hover:underline mr-3">Edit</Link>
                    )}
                    {isAdmin && (
                      <button onClick={() => setShowDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                    )}
                  </td>
                </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No marriage records found.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete !== null}
        title="Delete marriage record?"
        message="This will permanently remove the record."
        confirmLabel="Delete"
        onConfirm={() => showDelete && handleDelete(showDelete)}
        onCancel={() => setShowDelete(null)}
      />
    </div>
  );
}
