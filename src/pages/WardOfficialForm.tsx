// src/pages/WardOfficialForm.tsx — create OR edit
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { wardOfficialsApi, villagesApi } from "../api";
import { ApiRequestError } from "../api/client";
import { useToast } from "../components/Toast";
import type { Village } from "../types";

const GENDERS = ["Male", "Female"] as const;

const schema = z.object({
  surname: z.string().min(1, "Surname is required").max(100),
  given_name: z.string().min(1, "Given name is required").max(100),
  gender: z.enum(GENDERS),
  date_of_birth: z.string().optional().nullable().or(z.literal("")),
  official_type: z.string().min(1, "Official type is required").max(200),
  position_status: z.string().min(1, "Position/status is required").max(200),
  village_id: z.string().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable().or(z.literal("")),
  email: z.string().optional().nullable().or(z.literal("")),
  appointed_date: z.string().optional().nullable().or(z.literal("")),
  is_active: z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

export default function WardOfficialForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { push } = useToast();
  const [loading, setLoading] = useState(isEdit);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [villages, setVillages] = useState<Village[]>([]);

  useEffect(() => {
    villagesApi.list().then((r) => setVillages(r.items));
  }, []);

  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      surname: "",
      given_name: "",
      gender: "Male",
      date_of_birth: "",
      official_type: "",
      position_status: "",
      village_id: "",
      phone: "",
      email: "",
      appointed_date: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    wardOfficialsApi.get(Number(id))
      .then((o) => {
        reset({
          surname: o.surname,
          given_name: o.given_name,
          gender: o.gender,
          date_of_birth: o.date_of_birth ?? "",
          official_type: o.official_type,
          position_status: o.position_status,
          village_id: o.village_id ? String(o.village_id) : "",
          phone: o.phone ?? "",
          email: o.email ?? "",
          appointed_date: o.appointed_date ?? "",
          is_active: o.is_active,
        });
      })
      .catch(() => push("error", "Official not found"))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset, push]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    const payload = {
      surname: values.surname,
      given_name: values.given_name,
      gender: values.gender,
      date_of_birth: values.date_of_birth || null,
      official_type: values.official_type,
      position_status: values.position_status,
      village_id: values.village_id ? Number(values.village_id) : null,
      phone: values.phone || null,
      email: values.email || null,
      appointed_date: values.appointed_date || null,
      is_active: values.is_active,
    };
    try {
      if (isEdit && id) {
        await wardOfficialsApi.update(Number(id), payload);
        push("success", "Official updated");
        navigate(`/ward-officials/${id}`);
      } else {
        const created = await wardOfficialsApi.create(payload);
        push("success", "Official created");
        navigate(`/ward-officials/${created.id}`);
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
        <h1 className="text-2xl font-bold">{isEdit ? "Edit official" : "New official"}</h1>
        <Link to={isEdit && id ? `/ward-officials/${id}` : "/ward-officials"} className="btn-ghost text-sm">
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <div className="card-body space-y-5">
          {serverError && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Surname <span className="text-red-500">*</span></label>
              <input className="input" {...register("surname")} />
              {errors.surname && <p className="field-error">{errors.surname.message}</p>}
            </div>
            <div>
              <label className="label">Given name <span className="text-red-500">*</span></label>
              <input className="input" {...register("given_name")} />
              {errors.given_name && <p className="field-error">{errors.given_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Gender <span className="text-red-500">*</span></label>
              <select className="input" {...register("gender")}>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date of birth</label>
              <input type="date" className="input" {...register("date_of_birth")} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Official type <span className="text-red-500">*</span></label>
              <input className="input" placeholder="e.g. Ward Member, Ward Recorder" {...register("official_type")} />
              {errors.official_type && <p className="field-error">{errors.official_type.message}</p>}
            </div>
            <div>
              <label className="label">Position / Status <span className="text-red-500">*</span></label>
              <input className="input" placeholder="e.g. Councilor, Recorder, Magistrate" {...register("position_status")} />
              {errors.position_status && <p className="field-error">{errors.position_status.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Village</label>
              <select className="input" {...register("village_id")}>
                <option value="">— None —</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" {...register("phone")} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" {...register("email")} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Appointed date</label>
              <input type="date" className="input" {...register("appointed_date")} />
            </div>
            <div>
              <label className="label">Active</label>
              <select className="input" {...register("is_active")}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Link to={isEdit && id ? `/ward-officials/${id}` : "/ward-officials"} className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={!isValid || submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create official"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
