// src/pages/HouseDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { housesApi } from "../api";
import type { House } from "../types";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export default function HouseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, can } = useAuth();
  const { push } = useToast();
  const [house, setHouse] = useState<House | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    housesApi.get(Number(id))
      .then(setHouse)
      .catch(() => push("error", "House not found"))
      .finally(() => setLoading(false));
  }, [id, push]);

  async function handleDelete() {
    if (!id) return;
    try {
      await housesApi.remove(Number(id));
      push("success", "House deleted");
      navigate("/houses");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!house) return (
    <div className="text-center text-slate-500">
      <p>House not found.</p>
      <Link to="/houses" className="text-brand-700 hover:underline">← Back to houses</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <Link to="/houses" className="text-sm text-brand-700 hover:underline">← Back to houses</Link>
          <h1 className="text-2xl font-bold mt-1">{house.owner_name}</h1>
          <p className="text-sm text-slate-500">
            {house.house_type} · {house.house_purpose} · {house.num_houses} house(s)
          </p>
        </div>
        <div className="flex gap-2">
          {can("houses", "update") && (
            <Link to={`/houses/${house.id}/edit`} className="btn-secondary">Edit</Link>
          )}
          {isAdmin && (
            <button onClick={() => setShowDelete(true)} className="btn-danger">Delete</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Owner" value={house.owner_name} />
          <Field label="Village" value={house.village_name || "—"} />
          <Field label="Clan" value={house.clan_name || "—"} />
          <Field label="House type" value={house.house_type} />
          <Field label="Purpose" value={house.house_purpose} />
          <Field label="No. of houses" value={String(house.num_houses)} />
          <Field label="Comments" value={house.comments || "—"} />
          <Field label="Record created" value={new Date(house.created_at).toLocaleString()} />
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete house record?"
        message={`This will permanently remove the house record for ${house.owner_name}.`}
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
