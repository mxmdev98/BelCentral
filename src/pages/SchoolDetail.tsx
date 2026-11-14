// src/pages/SchoolDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { schoolApi } from "../api";
import type { School } from "../types";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export default function SchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, can } = useAuth();
  const { push } = useToast();
  const [item, setItem] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    schoolApi.get(Number(id))
      .then(setItem)
      .catch(() => push("error", "School not found"))
      .finally(() => setLoading(false));
  }, [id, push]);

  async function handleDelete() {
    if (!id) return;
    try {
      await schoolApi.remove(Number(id));
      push("success", "School deleted");
      navigate("/schools");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!item) return (
    <div className="text-center text-slate-500">
      <p>School not found.</p>
      <Link to="/schools" className="text-brand-700 hover:underline">← Back to schools & education</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <Link to="/schools" className="text-sm text-brand-700 hover:underline">← Back to schools & education</Link>
          <h1 className="text-2xl font-bold mt-1">{item.school_name}</h1>
        </div>
        <div className="flex gap-2">
          {can("schools", "update") && (
            <Link to={`/schools/${item.id}/edit`} className="btn-secondary">Edit</Link>
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
  <Field label="School type" value={item.school_type || "—"} />
  <Field label="School name" value={item.school_name || "—"} />
  <Field label="Operating agency" value={item.operating_agency || "—"} />
  <Field label="Male students" value={String(item.male_students ?? "—")} />
  <Field label="Female students" value={String(item.female_students ?? "—")} />
  <Field label="Male teachers" value={String(item.male_teachers ?? "—")} />
  <Field label="Female teachers" value={String(item.female_teachers ?? "—")} />
  <Field label="Distance (km)" value={item.distance_km || "—"} />
  <Field label="Travel time" value={item.travel_time || "—"} />
  <Field label="Travel mode" value={item.travel_mode || "—"} />
  <Field label="Location type" value={item.location_type || "—"} />
  <Field label="Comments" value={item.comments || "—"} />
  <Field label="Record created" value={new Date(item.created_at).toLocaleString()} />
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete school record?"
        message={`This will permanently remove the record for ${item.school_name}.`}
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
