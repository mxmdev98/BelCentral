// src/pages/BirthDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { birthApi } from "../api";
import type { Birth } from "../types";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export default function BirthDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, can } = useAuth();
  const { push } = useToast();
  const [item, setItem] = useState<Birth | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    birthApi.get(Number(id))
      .then(setItem)
      .catch(() => push("error", "Birth not found"))
      .finally(() => setLoading(false));
  }, [id, push]);

  async function handleDelete() {
    if (!id) return;
    try {
      await birthApi.remove(Number(id));
      push("success", "Birth deleted");
      navigate("/births");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!item) return (
    <div className="text-center text-slate-500">
      <p>Birth not found.</p>
      <Link to="/births" className="text-brand-700 hover:underline">← Back to births</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <Link to="/births" className="text-sm text-brand-700 hover:underline">← Back to births</Link>
          <h1 className="text-2xl font-bold mt-1">{item.child_name}</h1>
        </div>
        <div className="flex gap-2">
          {can("births", "update") && (
            <Link to={`/births/${item.id}/edit`} className="btn-secondary">Edit</Link>
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
  <Field label="Child name" value={item.child_name || "—"} />
  <Field label="Father's name" value={item.father_name || "—"} />
  <Field label="Mother's name" value={item.mother_name || "—"} />
  <Field label="Gender" value={item.gender || "—"} />
  <Field label="Date of birth" value={item.date_of_birth || "—"} />
  <Field label="Time of birth" value={item.time_of_birth || "—"} />
  <Field label="Place of birth" value={item.place_of_birth || "—"} />
  <Field label="Comments" value={item.comments || "—"} />
  <Field label="Record created" value={new Date(item.created_at).toLocaleString()} />
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete birth record?"
        message={`This will permanently remove the record for ${item.child_name}.`}
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
