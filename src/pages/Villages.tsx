// src/pages/Villages.tsx — full CRUD for villages (admin manages the list).
import { useEffect, useState } from "react";
import { villagesApi } from "../api";
import { ApiRequestError } from "../api/client";
import type { Village } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";

export default function Villages() {
  const { isAdmin } = useAuth();
  const { push } = useToast();
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // add/edit modal state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Village | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  // delete state
  const [deleteTarget, setDeleteTarget] = useState<Village | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    villagesApi
      .list()
      .then((r) => setVillages(r.items))
      .catch(() => push("error", "Failed to load villages"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [push]);

  function openAdd() {
    setEditing(null);
    setName("");
    setShowForm(true);
  }

  function openEdit(v: Village) {
    setEditing(v);
    setName(v.name);
    setShowForm(true);
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      push("error", "Village name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await villagesApi.update(editing.id, trimmed);
        setVillages((prev) =>
          prev
            .map((v) => (v.id === updated.id ? { ...v, name: updated.name } : v))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        push("success", "Village updated");
      } else {
        const created = await villagesApi.create(trimmed);
        setVillages((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        push("success", "Village created");
      }
      setShowForm(false);
    } catch (e) {
      push("error", e instanceof ApiRequestError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await villagesApi.delete(deleteTarget.id);
      setVillages((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      push("success", "Village deleted");
    } catch (e) {
      const msg =
        e instanceof ApiRequestError && e.status === 400
          ? `Cannot delete "${deleteTarget.name}": it is still referenced by tribes or residents. Remove those first.`
          : e instanceof ApiRequestError
            ? e.message
            : "Delete failed";
      push("error", msg);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const filtered = villages.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Villages</h1>
          <p className="text-sm text-slate-500">Land registry — manage the master list of villages.</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary">+ New village</button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Search</label>
              <input
                className="input"
                placeholder="Village name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-end text-sm text-slate-500">
              {villages.length} village{villages.length === 1 ? "" : "s"} in total
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Village</th>
                <th className="px-4 py-3 font-semibold">Tribes</th>
                <th className="px-4 py-3 font-semibold">Residents</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3">{v.tribe_count ?? "—"}</td>
                  <td className="px-4 py-3">{v.resident_count ?? "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEdit(v)}
                          className="text-brand-700 hover:underline mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(v)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No villages found.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showForm}
        title={editing ? "Edit village" : "New village"}
        onClose={() => setShowForm(false)}
        footer={
          <>
            <button
              onClick={() => setShowForm(false)}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button onClick={save} className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <label className="label">Village name</label>
        <input
          className="input"
          placeholder="e.g. Kranget"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        message="This permanently removes the village. If any tribes or residents reference it, the delete will be blocked."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
