// src/pages/PersonMovementForm.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { personMovementApi, villagesApi, clansApi } from "../api";
import { ApiRequestError } from "../api/client";
import { useToast } from "../components/Toast";
import type { Village, Clan } from "../types";

const schema = z.object({
  village_id: z.string().optional().or(z.literal("")),
  clan_id: z.string().optional().or(z.literal("")),
  surname: z.string().max(200).optional().or(z.literal("")),
  given_names: z.string().min(1, "Given names is required").max(200),
  gender: z.enum(['Male', 'Female']).optional().or(z.literal("")),
  age: z.coerce.number().int().min(0).max(150),
  direction: z.enum(['leaving', 'arriving']),
  movement_date: z.string().optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  reason: z.string().max(500).optional().or(z.literal("")),
  comments: z.string().max(500).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export default function PersonMovementForm() {
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
      surname: "",
      given_names: "",
      gender: "",
      age: 0,
      direction: "leaving",
      movement_date: "",
      location: "",
      reason: "",
      comments: "",
    },
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    personMovementApi.get(Number(id))
      .then((item) => {
        reset({
          village_id: item.village_id ? String(item.village_id) : "",
          clan_id: item.clan_id ? String(item.clan_id) : "",
          surname: item.surname ?? "",
          given_names: item.given_names ?? "",
          gender: item.gender ?? "",
          age: item.age ?? 0,
          direction: item.direction ?? "",
          movement_date: item.movement_date ?? "",
          location: item.location ?? "",
          reason: item.reason ?? "",
          comments: item.comments ?? "",
        });
      })
      .catch(() => push("error", "Movement not found"))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset, push]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    const payload = {
      village_id: values.village_id ? Number(values.village_id) : null,
      clan_id: values.clan_id ? Number(values.clan_id) : null,
      surname: values.surname || null,
      given_names: values.given_names,
      gender: values.gender || null,
      age: values.age,
      direction: values.direction,
      movement_date: values.movement_date ? values.movement_date : null,
      location: values.location || null,
      reason: values.reason || null,
      comments: values.comments || null,
    };
    try {
      if (isEdit && id) {
        await personMovementApi.update(Number(id), payload);
        push("success", "Movement updated");
        navigate(`/people-movement/${id}`);
      } else {
        const created = await personMovementApi.create(payload);
        push("success", "Movement created");
        navigate(`/people-movement/${created.id}`);
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
        <h1 className="text-2xl font-bold">{isEdit ? "Edit movement" : "New movement"}</h1>
        <Link to={isEdit && id ? `/people-movement/${id}` : "/people-movement"} className="btn-ghost text-sm">Cancel</Link>
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
              <label className="label">Surname</label>
              <input className="input" {...register("surname")} />
              {errors.surname && <p className="field-error">{errors.surname.message}</p>}
            </div>
            <div>
              <label className="label">Given names <span className="text-red-500">*</span></label>
              <input className="input" {...register("given_names")} />
              {errors.given_names && <p className="field-error">{errors.given_names.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Gender</label>
              <select className="input" {...register("gender")}>
                                <option value="">— None —</option>
                                <option key="Male" value="Male">Male</option>
                <option key="Female" value="Female">Female</option>
              </select>
              {errors.gender && <p className="field-error">{errors.gender.message}</p>}
            </div>
            <div>
              <label className="label">Age</label>
              <input type="number" className="input" min={0} max={150} {...register("age")} />
              {errors.age && <p className="field-error">{errors.age.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Direction <span className="text-red-500">*</span></label>
              <select className="input" {...register("direction")}>
                
                                <option key="leaving" value="leaving">leaving</option>
                <option key="arriving" value="arriving">arriving</option>
              </select>
              {errors.direction && <p className="field-error">{errors.direction.message}</p>}
            </div>
            <div>
              <label className="label">Movement date</label>
              <input type="date" className="input" {...register("movement_date")} />
              {errors.movement_date && <p className="field-error">{errors.movement_date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Location</label>
              <input className="input" {...register("location")} />
              {errors.location && <p className="field-error">{errors.location.message}</p>}
            </div>
            <div>
              <label className="label">Reason</label>
              <textarea className="input" rows={2} {...register("reason")} />
              {errors.reason && <p className="field-error">{errors.reason.message}</p>}
            </div>
          </div>

            <div>
              <label className="label">Comments</label>
              <textarea className="input" rows={2} {...register("comments")} />
              {errors.comments && <p className="field-error">{errors.comments.message}</p>}
            </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Link to={isEdit && id ? `/people-movement/${id}` : "/people-movement"} className="btn-secondary">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={!isValid || submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create movement"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
