// src/pages/HouseForm.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { housesApi, villagesApi, clansApi } from "../api";
import { ApiRequestError } from "../api/client";
import { useToast } from "../components/Toast";
import type { Village, Clan } from "../types";

const HOUSE_TYPES = ["Permanent", "Semi-Permanent", "Bush Material"] as const;

const schema = z.object({
  owner_name: z.string().min(1, "Owner name is required").max(200),
  village_id: z.string().optional().or(z.literal("")),
  clan_id: z.string().optional().or(z.literal("")),
  house_type: z.enum(HOUSE_TYPES),
  house_purpose: z.string().min(1, "Purpose is required").max(200).default("Residential"),
  num_houses: z.coerce.number().int().min(1, "Min 1").max(100, "Max 100").default(1),
  comments: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export default function HouseForm() {
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
      owner_name: "",
      village_id: "",
      clan_id: "",
      house_type: "Permanent",
      house_purpose: "Residential",
      num_houses: 1,
      comments: "",
    },
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    housesApi.get(Number(id))
      .then((h) => {
        reset({
          owner_name: h.owner_name,
          village_id: h.village_id ? String(h.village_id) : "",
          clan_id: h.clan_id ? String(h.clan_id) : "",
          house_type: h.house_type as typeof HOUSE_TYPES[number],
          house_purpose: h.house_purpose,
          num_houses: h.num_houses,
          comments: h.comments ?? "",
        });
      })
      .catch(() => push("error", "House not found"))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset, push]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    const payload = {
      owner_name: values.owner_name,
      village_id: values.village_id ? Number(values.village_id) : null,
      clan_id: values.clan_id ? Number(values.clan_id) : null,
      house_type: values.house_type,
      house_purpose: values.house_purpose,
      num_houses: values.num_houses,
      comments: values.comments || null,
    };
    try {
      if (isEdit && id) {
        await housesApi.update(Number(id), payload);
        push("success", "House updated");
        navigate(`/houses/${id}`);
      } else {
        const created = await housesApi.create(payload);
        push("success", "House created");
        navigate(`/houses/${created.id}`);
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
        <h1 className="text-2xl font-bold">{isEdit ? "Edit house" : "New house"}</h1>
        <Link to={isEdit && id ? `/houses/${id}` : "/houses"} className="btn-ghost text-sm">Cancel</Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <div className="card-body space-y-5">
          {serverError && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">{serverError}</div>
          )}

          <div>
            <label className="label">Owner name <span className="text-red-500">*</span></label>
            <input className="input" {...register("owner_name")} />
            {errors.owner_name && <p className="field-error">{errors.owner_name.message}</p>}
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">House type <span className="text-red-500">*</span></label>
              <select className="input" {...register("house_type")}>
                {HOUSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Purpose <span className="text-red-500">*</span></label>
              <input className="input" placeholder="Residential" {...register("house_purpose")} />
            </div>
            <div>
              <label className="label">No. of houses <span className="text-red-500">*</span></label>
              <input type="number" className="input" min={1} max={100} {...register("num_houses")} />
              {errors.num_houses && <p className="field-error">{errors.num_houses.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Comments <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea className="input" rows={2} {...register("comments")} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Link to={isEdit && id ? `/houses/${id}` : "/houses"} className="btn-secondary">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={!isValid || submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create house"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
