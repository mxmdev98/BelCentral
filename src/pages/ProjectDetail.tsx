// src/pages/ProjectDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { projectApi } from "../api";
import type { Project } from "../types";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, can } = useAuth();
  const { push } = useToast();
  const [item, setItem] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    projectApi.get(Number(id))
      .then(setItem)
      .catch(() => push("error", "Project not found"))
      .finally(() => setLoading(false));
  }, [id, push]);

  async function handleDelete() {
    if (!id) return;
    try {
      await projectApi.remove(Number(id));
      push("success", "Project deleted");
      navigate("/projects");
    } catch {
      push("error", "Delete failed");
    } finally {
      setShowDelete(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!item) return (
    <div className="text-center text-slate-500">
      <p>Project not found.</p>
      <Link to="/projects" className="text-brand-700 hover:underline">← Back to community projects</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <Link to="/projects" className="text-sm text-brand-700 hover:underline">← Back to community projects</Link>
          <h1 className="text-2xl font-bold mt-1">{item.project_type}</h1>
        </div>
        <div className="flex gap-2">
          {can("projects", "update") && (
            <Link to={`/projects/${item.id}/edit`} className="btn-secondary">Edit</Link>
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
  <Field label="Project type" value={item.project_type || "—"} />
  <Field label="Funding sources" value={item.funding_sources || "—"} />
  <Field label="Implementing organizations" value={item.implementing_organizations || "—"} />
  <Field label="Start date" value={item.start_date || "—"} />
  <Field label="Finish date" value={item.finish_date || "—"} />
  <Field label="Project status" value={item.project_status || "—"} />
  <Field label="Comments" value={item.comments || "—"} />
  <Field label="Record created" value={new Date(item.created_at).toLocaleString()} />
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete project record?"
        message={`This will permanently remove the record for ${item.project_type}.`}
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
