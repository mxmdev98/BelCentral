// src/pages/Projects.tsx  (plural filename)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projectApi, villagesApi } from "../api";
import type { Project, Village } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Projects() {
  const { can, isAdmin } = useAuth();
  const { push } = useToast();
  const [items, setItems] = useState<Project[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [showDelete, setShowDelete] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([projectApi.list(), villagesApi.list()])
      .then(([list, v]) => {
        setItems(list.items);
        setVillages(v.items);
      })
      .catch(() => push("error", "Failed to load project records"))
      .finally(() => setLoading(false));
  }, [push]);

  const filtered = items.filter((item) => {
    if (search) {
      const s = search.toLowerCase();
      const hay = [item.project_type, item.project_status, item.funding_sources, item.start_date].join(" ").toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (villageFilter && item.village_id !== Number(villageFilter)) return false;
    return true;
  });

  async function handleDelete(id: number) {
    try {
      await projectApi.remove(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      push("success", "Project record deleted");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Community Projects</h1>
        {can("projects", "create") && (
          <Link to="/projects/new" className="btn-primary">+ New project</Link>
        )}
      </div>

      <div className="card">
        <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Search</label>
            <input
              className="input"
              placeholder="Search project records…"
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
                <th className="px-4 py-3 font-semibold">Project</th>
                <th className="px-4 py-3 font-semibold">Village</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Funding sources</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/projects/${item.id}`} className="font-medium text-brand-700 hover:underline">
                      {item.project_type}
                    </Link>
                    {item.start_date && (
                      <div className="text-xs text-slate-500">Started {item.start_date}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{item.village_name || "—"}</td>
                  <td className="px-4 py-3">
                    {item.project_status ? (
                      <span className={`badge ${
                        item.project_status.toLowerCase() === "completed" ? "bg-green-100 text-green-800" :
                        item.project_status.toLowerCase() === "ongoing" ? "bg-blue-100 text-blue-800" :
                        item.project_status.toLowerCase() === "planned" ? "bg-slate-100 text-slate-600" :
                        item.project_status.toLowerCase() === "delayed" ? "bg-red-100 text-red-800" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {item.project_status}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate" title={item.funding_sources ?? ""}>
                    {item.funding_sources || "—"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {can("projects", "update") && (
                      <Link to={`/projects/${item.id}/edit`} className="text-brand-700 hover:underline mr-3">Edit</Link>
                    )}
                    {isAdmin && (
                      <button onClick={() => setShowDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No project records found.</td></tr>
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
        title="Delete project record?"
        message="This will permanently remove the record."
        confirmLabel="Delete"
        onConfirm={() => showDelete && handleDelete(showDelete)}
        onCancel={() => setShowDelete(null)}
      />
    </div>
  );
}
