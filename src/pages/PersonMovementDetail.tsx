// src/pages/PersonMovementDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { personMovementApi } from "../api";
import type { PersonMovement } from "../types";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export default function PersonMovementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, can } = useAuth();
  const { push } = useToast();
  const [item, setItem] = useState<PersonMovement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    personMovementApi.get(Number(id))
      .then(setItem)
      .catch(() => push("error", "Movement not found"))
      .finally(() => setLoading(false));
  }, [id, push]);

  async function handleDelete() {
    if (!id) return;
    try {
      await personMovementApi.remove(Number(id));
      push("success", "Movement deleted");
      navigate("/people-movement");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!item) return (
    <div className="text-center text-slate-500">
      <p>Movement not found.</p>
      <Link to="/people-movement" className="text-brand-700 hover:underline">← Back to people movement</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <Link to="/people-movement" className="text-sm text-brand-700 hover:underline">← Back to people movement</Link>
          <h1 className="text-2xl font-bold mt-1">{item.given_names}</h1>
        </div>
        <div className="flex gap-2">
          {can("people_movement", "update") && (
            <Link to={`/people-movement/${item.id}/edit`} className="btn-secondary">Edit</Link>
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
  <Field label="Direction" value={item.direction || "—"} />
  <Field label="Movement date" value={item.movement_date || "—"} />
  <Field label="Location" value={item.location || "—"} />
  <Field label="Reason" value={item.reason || "—"} />
  <Field label="Comments" value={item.comments || "—"} />
  <Field label="Record created" value={new Date(item.created_at).toLocaleString()} />
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete movement record?"
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
