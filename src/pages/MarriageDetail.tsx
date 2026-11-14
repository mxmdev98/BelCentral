// src/pages/MarriageDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { marriageApi } from "../api";
import type { Marriage } from "../types";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export default function MarriageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, can } = useAuth();
  const { push } = useToast();
  const [item, setItem] = useState<Marriage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    marriageApi.get(Number(id))
      .then(setItem)
      .catch(() => push("error", "Marriage not found"))
      .finally(() => setLoading(false));
  }, [id, push]);

  async function handleDelete() {
    if (!id) return;
    try {
      await marriageApi.remove(Number(id));
      push("success", "Marriage deleted");
      navigate("/marriages");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!item) return (
    <div className="text-center text-slate-500">
      <p>Marriage not found.</p>
      <Link to="/marriages" className="text-brand-700 hover:underline">← Back to marriages</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <Link to="/marriages" className="text-sm text-brand-700 hover:underline">← Back to marriages</Link>
          <h1 className="text-2xl font-bold mt-1">{item.husband_given_names}</h1>
        </div>
        <div className="flex gap-2">
          {can("marriages", "update") && (
            <Link to={`/marriages/${item.id}/edit`} className="btn-secondary">Edit</Link>
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
  <Field label="Husband surname" value={item.husband_surname || "—"} />
  <Field label="Husband given names" value={item.husband_given_names || "—"} />
  <Field label="Wife surname" value={item.wife_surname || "—"} />
  <Field label="Wife given names" value={item.wife_given_names || "—"} />
  <Field label="Date of marriage" value={item.date_of_marriage || "—"} />
  <Field label="Marriage type" value={item.marriage_type || "—"} />
  <Field label="Place of marriage" value={item.place_of_marriage || "—"} />
  <Field label="Comments" value={item.comments || "—"} />
  <Field label="Record created" value={new Date(item.created_at).toLocaleString()} />
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete marriage record?"
        message={`This will permanently remove the record for ${item.husband_given_names}.`}
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
