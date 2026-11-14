// src/pages/TenantForm.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { tenantApi, villagesApi, clansApi } from "../api";
import { ApiRequestError } from "../api/client";
import { useToast } from "../components/Toast";
import type { Village, Clan } from "../types";

const schema = z.object({
  village_id: z.string().optional().or(z.literal("")),
  clan_id: z.string().optional().or(z.literal("")),
  given_name: z.string().min(1, "Given name is required").max(200),
  father_name: z.string().max(200).optional().or(z.literal("")),
  mother_name: z.string().max(200).optional().or(z.literal("")),
  gender: z.enum(['Male', 'Female']).optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  landlord_name: z.string().max(200).optional().or(z.literal("")),
  place_of_origin: z.string().max(200).optional().or(z.literal("")),
  profession: z.string().max(200).optional().or(z.literal("")),
  comments: z.string().max(500).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export default function TenantForm() {
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
      given_name: "",
      father_name: "",
      mother_name: "",
      gender: "",
      date_of_birth: "",
      landlord_name: "",
      place_of_origin: "",
      profession: "",
      comments: "",
    },
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    tenantApi.get(Number(id))
      .then((item) => {
        reset({
          village_id: item.village_id ? String(item.village_id) : "",
          clan_id: item.clan_id ? String(item.clan_id) : "",
          given_name: item.given_name ?? "",
          father_name: item.father_name ?? "",
          mother_name: item.mother_name ?? "",
          gender: item.gender ?? "",
          date_of_birth: item.date_of_birth ?? "",
          landlord_name: item.landlord_name ?? "",
          place_of_origin: item.place_of_origin ?? "",
          profession: item.profession ?? "",
          comments: item.comments ?? "",
        });
      })
      .catch(() => push("error", "Tenant not found"))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset, push]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    const payload = {
      village_id: values.village_id ? Number(values.village_id) : null,
      clan_id: values.clan_id ? Number(values.clan_id) : null,
      given_name: values.given_name,
      father_name: values.father_name || null,
      mother_name: values.mother_name || null,
      gender: values.gender || null,
      date_of_birth: values.date_of_birth ? values.date_of_birth : null,
      landlord_name: values.landlord_name || null,
      place_of_origin: values.place_of_origin || null,
      profession: values.profession || null,
      comments: values.comments || null,
    };
    try {
      if (isEdit && id) {
        await tenantApi.update(Number(id), payload);
        push("success", "Tenant updated");
        navigate(`/tenants/${id}`);
      } else {
        const created = await tenantApi.create(payload);
        push("success", "Tenant created");
        navigate(`/tenants/${created.id}`);
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
        <h1 className="text-2xl font-bold">{isEdit ? "Edit tenant" : "New tenant"}</h1>
        <Link to={isEdit && id ? `/tenants/${id}` : "/tenants"} className="btn-ghost text-sm">Cancel</Link>
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
              <label className="label">Given name <span className="text-red-500">*</span></label>
              <input className="input" {...register("given_name")} />
              {errors.given_name && <p className="field-error">{errors.given_name.message}</p>}
            </div>
            <div>
              <label className="label">Father's name</label>
              <input className="input" {...register("father_name")} />
              {errors.father_name && <p className="field-error">{errors.father_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Mother's name</label>
              <input className="input" {...register("mother_name")} />
              {errors.mother_name && <p className="field-error">{errors.mother_name.message}</p>}
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" {...register("gender")}>
                                <option value="">— None —</option>
                                <option key="Male" value="Male">Male</option>
                <option key="Female" value="Female">Female</option>
              </select>
              {errors.gender && <p className="field-error">{errors.gender.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Date of birth</label>
              <input type="date" className="input" {...register("date_of_birth")} />
              {errors.date_of_birth && <p className="field-error">{errors.date_of_birth.message}</p>}
            </div>
            <div>
              <label className="label">Landlord name</label>
              <input className="input" {...register("landlord_name")} />
              {errors.landlord_name && <p className="field-error">{errors.landlord_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Place of origin</label>
              <input className="input" {...register("place_of_origin")} />
              {errors.place_of_origin && <p className="field-error">{errors.place_of_origin.message}</p>}
            </div>
            <div>
              <label className="label">Profession</label>
              <input className="input" {...register("profession")} />
              {errors.profession && <p className="field-error">{errors.profession.message}</p>}
            </div>
          </div>

            <div>
              <label className="label">Comments</label>
              <textarea className="input" rows={2} {...register("comments")} />
              {errors.comments && <p className="field-error">{errors.comments.message}</p>}
            </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Link to={isEdit && id ? `/tenants/${id}` : "/tenants"} className="btn-secondary">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={!isValid || submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create tenant"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
