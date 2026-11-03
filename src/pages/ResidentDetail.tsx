// src/pages/ResidentDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { residentsApi } from "../api";
import { ApiRequestError } from "../api/client";
import type { ResidentDetail } from "../types";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export default function ResidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { push } = useToast();
  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    residentsApi.get(id)
      .then(setResident)
      .catch(() => push("error", "Resident not found"))
      .finally(() => setLoading(false));
  }, [id, push]);

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await residentsApi.remove(id);
      push("success", "Resident deleted");
      navigate("/residents");
    } catch (err) {
      push("error", err instanceof ApiRequestError ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!resident) return (
    <div className="text-center text-slate-500">
      <p>Resident not found.</p>
      <Link to="/residents" className="text-brand-700 hover:underline">← Back to residents</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <Link to="/residents" className="text-sm text-brand-700 hover:underline">
            ← Back to residents
          </Link>
          <h1 className="text-2xl font-bold mt-1">{resident.full_name}</h1>
          <p className="text-sm text-slate-500">
            {resident.gender} · {resident.age} years · DOB {resident.date_of_birth}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/residents/${resident.id}/edit`} className="btn-secondary">Edit</Link>
          {isAdmin && (
            <button onClick={() => setShowDelete(true)} className="btn-danger">Delete</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Father's name" value={resident.father_name} />
          <Field label="Mother's name" value={resident.mother_name} />
          <Field label="Village" value={resident.village_name} />
          <Field label="Tribe" value={resident.tribe_name} />
          <Field label="Clan" value={resident.clan_name} />
          <Field label="Employment status" value={resident.employment_status} />
          <Field label="Marital status" value={resident.marital_status} />
          <Field label="Education level" value={resident.education_level} />
          <Field label="Profession" value={resident.profession || "—"} />
          <Field label="Record created" value={new Date(resident.created_at).toLocaleString()} />
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete resident?"
        message={
          <>
            This will <strong>soft-delete</strong> the record for{" "}
            <strong>{resident.full_name}</strong>. The record will no longer appear
            in searches or reports, but remains in the database for audit. This
            action can only be reversed manually by a database admin.
          </>
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        loading={deleting}
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
