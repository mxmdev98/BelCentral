// src/pages/ProjectForm.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { projectApi, villagesApi, clansApi } from "../api";
import { ApiRequestError } from "../api/client";
import { useToast } from "../components/Toast";
import type { Village, Clan } from "../types";

const schema = z.object({
  village_id: z.string().optional().or(z.literal("")),
  clan_id: z.string().optional().or(z.literal("")),
  project_type: z.string().min(1, "Project type is required").max(200),
  funding_sources: z.string().max(500).optional().or(z.literal("")),
  implementing_organizations: z.string().max(500).optional().or(z.literal("")),
  start_date: z.string().max(200).optional().or(z.literal("")),
  finish_date: z.string().max(200).optional().or(z.literal("")),
  project_status: z.string().max(200).optional().or(z.literal("")),
  comments: z.string().max(500).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export default function ProjectForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { push } = useToast();
  const [loading, setLoading] = useState(isEdit);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [villages, setVillages] = useState<Village[]>([]);
  const [clans, setClans] = useState<Clan[]>([]);

  useEffect(() => {
    Promise.all([villagesApi.list(), clansApi.list()]).then(([v, c]) => {
      setVillages(v.items);
      setClans(c.items);
    });
  }, []);

  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      village_id: "",
      clan_id: "",
      project_type: "",
      funding_sources: "",
      implementing_organizations: "",
      start_date: "",
      finish_date: "",
      project_status: "",
      comments: "",
    },
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    projectApi.get(Number(id))
      .then((item) => {
        reset({
          village_id: item.village_id ? String(item.village_id) : "",
          clan_id: item.clan_id ? String(item.clan_id) : "",
          project_type: item.project_type ?? "",
          funding_sources: item.funding_sources ?? "",
          implementing_organizations: item.implementing_organizations ?? "",
          start_date: item.start_date ?? "",
          finish_date: item.finish_date ?? "",
          project_status: item.project_status ?? "",
          comments: item.comments ?? "",
        });
      })
      .catch(() => push("error", "Project not found"))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset, push]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    const payload = {
      village_id: values.village_id ? Number(values.village_id) : null,
      clan_id: values.clan_id ? Number(values.clan_id) : null,
      project_type: values.project_type,
      funding_sources: values.funding_sources || null,
      implementing_organizations: values.implementing_organizations || null,
      start_date: values.start_date || null,
      finish_date: values.finish_date || null,
      project_status: values.project_status || null,
      comments: values.comments || null,
    };
    try {
      if (isEdit && id) {
        await projectApi.update(Number(id), payload);
        push("success", "Project updated");
        navigate(`/projects/${id}`);
      } else {
        const created = await projectApi.create(payload);
        push("success", "Project created");
        navigate(`/projects/${created.id}`);
      }
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isEdit ? "Edit project" : "New project"}</h1>
        <Link to={isEdit && id ? `/projects/${id}` : "/projects"} className="btn-ghost text-sm">Cancel</Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <div className="card-body space-y-5">
          {serverError && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">{serverError}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Village</label>
              <select className="input" {...register("village_id")}>
                <option value="">— None —</option>
                {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Clan</label>
              <select className="input" {...register("clan_id")}>
                <option value="">— None —</option>
                {clans.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Project type <span className="text-red-500">*</span></label>
              <input className="input" {...register("project_type")} />
              {errors.project_type && <p className="field-error">{errors.project_type.message}</p>}
            </div>
            <div>
              <label className="label">Funding sources</label>
              <textarea className="input" rows={2} {...register("funding_sources")} />
              {errors.funding_sources && <p className="field-error">{errors.funding_sources.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Implementing organizations</label>
              <textarea className="input" rows={2} {...register("implementing_organizations")} />
              {errors.implementing_organizations && <p className="field-error">{errors.implementing_organizations.message}</p>}
            </div>
            <div>
              <label className="label">Start date</label>
              <input className="input" {...register("start_date")} />
              {errors.start_date && <p className="field-error">{errors.start_date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Finish date</label>
              <input className="input" {...register("finish_date")} />
              {errors.finish_date && <p className="field-error">{errors.finish_date.message}</p>}
            </div>
            <div>
              <label className="label">Project status</label>
              <input className="input" {...register("project_status")} />
              {errors.project_status && <p className="field-error">{errors.project_status.message}</p>}
            </div>
          </div>

            <div>
              <label className="label">Comments</label>
              <textarea className="input" rows={2} {...register("comments")} />
              {errors.comments && <p className="field-error">{errors.comments.message}</p>}
            </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Link to={isEdit && id ? `/projects/${id}` : "/projects"} className="btn-secondary">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={!isValid || submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create project"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
