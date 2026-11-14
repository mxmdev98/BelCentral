// src/pages/DisabledPersonForm.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { disabledPersonApi, villagesApi, clansApi } from "../api";
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
  nature_of_disability: z.string().min(1, "Nature of disability is required").max(500),
  comments: z.string().max(500).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export default function DisabledPersonForm() {
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
      nature_of_disability: "",
      comments: "",
    },
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    disabledPersonApi.get(Number(id))
      .then((item) => {
        reset({
          village_id: item.village_id ? String(item.village_id) : "",
          clan_id: item.clan_id ? String(item.clan_id) : "",
          surname: item.surname ?? "",
          given_names: item.given_names ?? "",
          gender: item.gender ?? "",
          age: item.age ?? 0,
          nature_of_disability: item.nature_of_disability ?? "",
          comments: item.comments ?? "",
        });
      })
      .catch(() => push("error", "Person not found"))
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
      nature_of_disability: values.nature_of_disability,
      comments: values.comments || null,
    };
    try {
      if (isEdit && id) {
        await disabledPersonApi.update(Number(id), payload);
        push("success", "Person updated");
        navigate(`/disabled-persons/${id}`);
      } else {
        const created = await disabledPersonApi.create(payload);
        push("success", "Person created");
        navigate(`/disabled-persons/${created.id}`);
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
        <h1 className="text-2xl font-bold">{isEdit ? "Edit person" : "New person"}</h1>
        <Link to={isEdit && id ? `/disabled-persons/${id}` : "/disabled-persons"} className="btn-ghost text-sm">Cancel</Link>
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
              <label className="label">Nature of disability <span className="text-red-500">*</span></label>
              <textarea className="input" rows={2} {...register("nature_of_disability")} />
              {errors.nature_of_disability && <p className="field-error">{errors.nature_of_disability.message}</p>}
            </div>
            <div>
              <label className="label">Comments</label>
              <textarea className="input" rows={2} {...register("comments")} />
              {errors.comments && <p className="field-error">{errors.comments.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Link to={isEdit && id ? `/disabled-persons/${id}` : "/disabled-persons"} className="btn-secondary">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={!isValid || submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create person"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
