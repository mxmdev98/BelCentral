// src/pages/DeathDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { deathApi } from "../api";
import type { Death } from "../types";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export default function DeathDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, can } = useAuth();
  const { push } = useToast();
  const [item, setItem] = useState<Death | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    deathApi.get(Number(id))
      .then(setItem)
      .catch(() => push("error", "Death not found"))
      .finally(() => setLoading(false));
  }, [id, push]);

  async function handleDelete() {
    if (!id) return;
    try {
      await deathApi.remove(Number(id));
      push("success", "Death deleted");
      navigate("/deaths");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!item) return (
    <div className="text-center text-slate-500">
      <p>Death not found.</p>
      <Link to="/deaths" className="text-brand-700 hover:underline">← Back to deaths</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <Link to="/deaths" className="text-sm text-brand-700 hover:underline">← Back to deaths</Link>
          <h1 className="text-2xl font-bold mt-1">{item.given_names}</h1>
        </div>
        <div className="flex gap-2">
          {can("deaths", "update") && (
            <Link to={`/deaths/${item.id}/edit`} className="btn-secondary">Edit</Link>
          )}
          {isAdmin && (
            <button onClick={() => setShowDelete(true)} className="btn-danger">Delete</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Field label="Village" value={item.village_name || "—"} />
  <Field label="Clan" value={item.clan_name || "—"} />
  <Field label="Surname" value={item.surname || "—"} />
  <Field label="Given names" value={item.given_names || "—"} />
  <Field label="Gender" value={item.gender || "—"} />
  <Field label="Age" value={String(item.age ?? "—")} />
  <Field label="Date of death" value={item.date_of_death || "—"} />
  <Field label="Cause of death" value={item.cause_of_death || "—"} />
  <Field label="Comments" value={item.comments || "—"} />
  <Field label="Record created" value={new Date(item.created_at).toLocaleString()} />
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete death record?"
        message={`This will permanently remove the record for ${item.given_names}.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}
