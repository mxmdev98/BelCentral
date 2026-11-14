// src/pages/SchoolForm.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { schoolApi, villagesApi, clansApi } from "../api";
import { ApiRequestError } from "../api/client";
import { useToast } from "../components/Toast";
import type { Village, Clan } from "../types";

const schema = z.object({
  village_id: z.string().optional().or(z.literal("")),
  clan_id: z.string().optional().or(z.literal("")),
  school_type: z.string().min(1, "School type is required").max(200),
  school_name: z.string().min(1, "School name is required").max(200),
  operating_agency: z.string().max(200).optional().or(z.literal("")),
  male_students: z.coerce.number().int().min(0).max(10000).default(0),
  female_students: z.coerce.number().int().min(0).max(10000).default(0),
  male_teachers: z.coerce.number().int().min(0).max(1000).default(0),
  female_teachers: z.coerce.number().int().min(0).max(1000).default(0),
  distance_km: z.string().max(200).optional().or(z.literal("")),
  travel_time: z.string().max(200).optional().or(z.literal("")),
  travel_mode: z.string().max(200).optional().or(z.literal("")),
  location_type: z.string().max(200).optional().or(z.literal("")),
  comments: z.string().max(500).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export default function SchoolForm() {
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
      school_type: "",
      school_name: "",
      operating_agency: "",
      male_students: 0,
      female_students: 0,
      male_teachers: 0,
      female_teachers: 0,
      distance_km: "",
      travel_time: "",
      travel_mode: "",
      location_type: "",
      comments: "",
    },
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    schoolApi.get(Number(id))
      .then((item) => {
        reset({
          village_id: item.village_id ? String(item.village_id) : "",
          clan_id: item.clan_id ? String(item.clan_id) : "",
          school_type: item.school_type ?? "",
          school_name: item.school_name ?? "",
          operating_agency: item.operating_agency ?? "",
          male_students: item.male_students ?? 0,
          female_students: item.female_students ?? 0,
          male_teachers: item.male_teachers ?? 0,
          female_teachers: item.female_teachers ?? 0,
          distance_km: item.distance_km ?? "",
          travel_time: item.travel_time ?? "",
          travel_mode: item.travel_mode ?? "",
          location_type: item.location_type ?? "",
          comments: item.comments ?? "",
        });
      })
      .catch(() => push("error", "School not found"))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset, push]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    const payload = {
      village_id: values.village_id ? Number(values.village_id) : null,
      clan_id: values.clan_id ? Number(values.clan_id) : null,
      school_type: values.school_type,
      school_name: values.school_name,
      operating_agency: values.operating_agency || null,
      male_students: values.male_students,
      female_students: values.female_students,
      male_teachers: values.male_teachers,
      female_teachers: values.female_teachers,
      distance_km: values.distance_km || null,
      travel_time: values.travel_time || null,
      travel_mode: values.travel_mode || null,
      location_type: values.location_type || null,
      comments: values.comments || null,
    };
    try {
      if (isEdit && id) {
        await schoolApi.update(Number(id), payload);
        push("success", "School updated");
        navigate(`/schools/${id}`);
      } else {
        const created = await schoolApi.create(payload);
        push("success", "School created");
        navigate(`/schools/${created.id}`);
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
        <h1 className="text-2xl font-bold">{isEdit ? "Edit school" : "New school"}</h1>
        <Link to={isEdit && id ? `/schools/${id}` : "/schools"} className="btn-ghost text-sm">Cancel</Link>
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
              <label className="label">School type <span className="text-red-500">*</span></label>
              <input className="input" {...register("school_type")} />
              {errors.school_type && <p className="field-error">{errors.school_type.message}</p>}
            </div>
            <div>
              <label className="label">School name <span className="text-red-500">*</span></label>
              <input className="input" {...register("school_name")} />
              {errors.school_name && <p className="field-error">{errors.school_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Operating agency</label>
              <input className="input" {...register("operating_agency")} />
              {errors.operating_agency && <p className="field-error">{errors.operating_agency.message}</p>}
            </div>
            <div>
              <label className="label">Male students <span className="text-red-500">*</span></label>
              <input type="number" className="input" min={0} max={10000} {...register("male_students")} />
              {errors.male_students && <p className="field-error">{errors.male_students.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Female students <span className="text-red-500">*</span></label>
              <input type="number" className="input" min={0} max={10000} {...register("female_students")} />
              {errors.female_students && <p className="field-error">{errors.female_students.message}</p>}
            </div>
            <div>
              <label className="label">Male teachers <span className="text-red-500">*</span></label>
              <input type="number" className="input" min={0} max={1000} {...register("male_teachers")} />
              {errors.male_teachers && <p className="field-error">{errors.male_teachers.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Female teachers <span className="text-red-500">*</span></label>
              <input type="number" className="input" min={0} max={1000} {...register("female_teachers")} />
              {errors.female_teachers && <p className="field-error">{errors.female_teachers.message}</p>}
            </div>
            <div>
              <label className="label">Distance (km)</label>
              <input className="input" {...register("distance_km")} />
              {errors.distance_km && <p className="field-error">{errors.distance_km.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Travel time</label>
              <input className="input" {...register("travel_time")} />
              {errors.travel_time && <p className="field-error">{errors.travel_time.message}</p>}
            </div>
            <div>
              <label className="label">Travel mode</label>
              <input className="input" {...register("travel_mode")} />
              {errors.travel_mode && <p className="field-error">{errors.travel_mode.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Location type</label>
              <input className="input" {...register("location_type")} />
              {errors.location_type && <p className="field-error">{errors.location_type.message}</p>}
            </div>
            <div>
              <label className="label">Comments</label>
              <textarea className="input" rows={2} {...register("comments")} />
              {errors.comments && <p className="field-error">{errors.comments.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Link to={isEdit && id ? `/schools/${id}` : "/schools"} className="btn-secondary">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={!isValid || submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create school"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
