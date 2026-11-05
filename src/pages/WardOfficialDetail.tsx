// src/pages/WardOfficialDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { wardOfficialsApi } from "../api";
import type { WardOfficial } from "../types";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export default function WardOfficialDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, can } = useAuth();
  const { push } = useToast();
  const [official, setOfficial] = useState<WardOfficial | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    wardOfficialsApi.get(Number(id))
      .then(setOfficial)
      .catch(() => push("error", "Official not found"))
      .finally(() => setLoading(false));
  }, [id, push]);

  async function handleDelete() {
    if (!id) return;
    try {
      await wardOfficialsApi.remove(Number(id));
      push("success", "Official deleted");
      navigate("/ward-officials");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!official) return (
    <div className="text-center text-slate-500">
      <p>Official not found.</p>
      <Link to="/ward-officials" className="text-brand-700 hover:underline">← Back to officials</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <Link to="/ward-officials" className="text-sm text-brand-700 hover:underline">
            ← Back to officials
          </Link>
          <h1 className="text-2xl font-bold mt-1">{official.given_name} {official.surname}</h1>
          <p className="text-sm text-slate-500">
            {official.gender} · {official.official_type} · {official.position_status}
          </p>
        </div>
        <div className="flex gap-2">
          {can("ward_officials", "update") && (
            <Link to={`/ward-officials/${official.id}/edit`} className="btn-secondary">Edit</Link>
          )}
          {isAdmin && (
            <button onClick={() => setShowDelete(true)} className="btn-danger">Delete</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Surname" value={official.surname} />
          <Field label="Given name" value={official.given_name} />
          <Field label="Gender" value={official.gender} />
          <Field label="Date of birth" value={official.date_of_birth || "—"} />
          <Field label="Official type" value={official.official_type} />
          <Field label="Position / Status" value={official.position_status} />
          <Field label="Village" value={official.village_name || "—"} />
          <Field label="Phone" value={official.phone || "—"} />
          <Field label="Email" value={official.email || "—"} />
          <Field label="Appointed date" value={official.appointed_date || "—"} />
          <Field label="Status" value={official.is_active ? "Active" : "Inactive"} />
          <Field label="Record created" value={new Date(official.created_at).toLocaleString()} />
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete ward official?"
        message={`This will permanently remove ${official.given_name} ${official.surname} from the register.`}
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
