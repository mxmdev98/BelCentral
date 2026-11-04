// src/pages/ResidentForm.tsx — create OR edit (mode based on route).
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { residentsApi, villagesApi, tribesApi, clansApi } from "../api";
import { ApiRequestError } from "../api/client";
import { useToast } from "../components/Toast";
import type { Village, Tribe, Clan } from "../types";

// Zod schema mirrors backend createResidentSchema.
const GENDERS = ["Male", "Female"] as const;
const EMPLOYMENT = ["Employed","Unemployed","Student","Retired","Self-Employed"] as const;
const MARITAL = ["Single","Married","Widowed","Divorced","Separated"] as const;
const EDUCATION = ["None","Primary","Secondary","Vocational","Tertiary"] as const;

const schema = z.object({
  full_name: z.string().min(1, "Full name is required").max(200),
  father_name: z.string().min(1, "Father's name is required").max(200),
  mother_name: z.string().min(1, "Mother's name is required").max(200),
  gender: z.enum(GENDERS),
  date_of_birth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date")
    .refine((v) => new Date(v) <= new Date(), "Date cannot be in the future"),
  village_id: z.coerce.number().int().positive("Village is required"),
  tribe_id: z.coerce.number().int().positive("Tribe is required"),
  clan_id: z.coerce.number().int().positive("Clan is required"),
  employment_status: z.enum(EMPLOYMENT),
  marital_status: z.enum(MARITAL),
  education_level: z.enum(EDUCATION),
  profession: z.string().max(200).optional().nullable(),
});
type FormValues = z.infer<typeof schema>;

export default function ResidentForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { push } = useToast();
  const [loadingResident, setLoadingResident] = useState(isEdit);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Independent dropdown lists — loaded once.
  const [villages, setVillages] = useState<Village[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [clans, setClans] = useState<Clan[]>([]);

  useEffect(() => {
    Promise.all([
      villagesApi.list(),
      tribesApi.list(),
      clansApi.list(),
    ]).then(([v, t, c]) => {
      setVillages(v.items);
      setTribes(t.items);
      setClans(c.items);
    }).catch((err) => console.error("Failed to load dropdown lists:", err));
  }, []);

  const { register, handleSubmit, reset, formState: { errors, isValid } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      mode: "onChange",
      defaultValues: {
        full_name: "", father_name: "", mother_name: "",
        gender: "Male", date_of_birth: "",
        village_id: undefined, tribe_id: undefined, clan_id: undefined,
        employment_status: "Unemployed",
        marital_status: "Single",
        education_level: "None",
        profession: "",
      },
    });

  // Pre-fill on edit.
  useEffect(() => {
    if (!isEdit || !id) return;
    residentsApi.get(id)
      .then((r) => {
        reset({
          full_name: r.full_name,
          father_name: r.father_name,
          mother_name: r.mother_name,
          gender: r.gender,
          date_of_birth: r.date_of_birth,
          village_id: r.village_id,
          tribe_id: r.tribe_id,
          clan_id: r.clan_id,
          employment_status: r.employment_status,
          marital_status: r.marital_status,
          education_level: r.education_level,
          profession: r.profession ?? "",
        });
      })
      .catch(() => push("error", "Resident not found"))
      .finally(() => setLoadingResident(false));
  }, [id, isEdit, reset, push]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    const payload = {
      full_name: values.full_name,
      father_name: values.father_name,
      mother_name: values.mother_name,
      gender: values.gender,
      date_of_birth: values.date_of_birth,
      village_id: values.village_id,
      tribe_id: values.tribe_id,
      clan_id: values.clan_id,
      employment_status: values.employment_status,
      marital_status: values.marital_status,
      education_level: values.education_level,
      profession: values.profession ?? null, 
    };
    try {
      if (isEdit && id) {
        await residentsApi.update(id, payload);
        push("success", "Resident updated");
        navigate(`/residents/${id}`);
      } else {
        const created = await residentsApi.create(payload as never);
        push("success", "Resident created");
        navigate(`/residents/${created.id}`);
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setServerError(err.message);
      } else {
        setServerError("Save failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingResident) return <div className="text-slate-500">Loading resident…</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isEdit ? "Edit resident" : "New resident"}</h1>
        <Link to={isEdit && id ? `/residents/${id}` : "/residents"} className="btn-ghost text-sm">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Full name <span className="text-red-500">*</span></label>
              <input className="input" {...register("full_name")} />
              {errors.full_name && <p className="field-error">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="label">Gender <span className="text-red-500">*</span></label>
              <select className="input" {...register("gender")}>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              {errors.gender && <p className="field-error">{errors.gender.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Father's name <span className="text-red-500">*</span></label>
              <input className="input" {...register("father_name")} />
              {errors.father_name && <p className="field-error">{errors.father_name.message}</p>}
            </div>
            <div>
              <label className="label">Mother's name <span className="text-red-500">*</span></label>
              <input className="input" {...register("mother_name")} />
              {errors.mother_name && <p className="field-error">{errors.mother_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Date of birth <span className="text-red-500">*</span></label>
              <input type="date" className="input" {...register("date_of_birth")} />
              {errors.date_of_birth && <p className="field-error">{errors.date_of_birth.message}</p>}
              <p className="text-xs text-slate-500 mt-1">Age is computed automatically.</p>
            </div>
          </div>

          {/* Village / Tribe / Clan — independent dropdowns (not cascading) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Village <span className="text-red-500">*</span></label>
              <select className="input" {...register("village_id")}>
                <option value="">— Select village —</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              {errors.village_id && <p className="field-error">{errors.village_id.message}</p>}
            </div>
            <div>
              <label className="label">Tribe <span className="text-red-500">*</span></label>
              <select className="input" {...register("tribe_id")}>
                <option value="">— Select tribe —</option>
                {tribes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {errors.tribe_id && <p className="field-error">{errors.tribe_id.message}</p>}
            </div>
            <div>
              <label className="label">Clan <span className="text-red-500">*</span></label>
              <select className="input" {...register("clan_id")}>
                <option value="">— Select clan —</option>
                {clans.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.clan_id && <p className="field-error">{errors.clan_id.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Employment status <span className="text-red-500">*</span></label>
              <select className="input" {...register("employment_status")}>
                {EMPLOYMENT.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Marital status <span className="text-red-500">*</span></label>
              <select className="input" {...register("marital_status")}>
                {MARITAL.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Education level <span className="text-red-500">*</span></label>
              <select className="input" {...register("education_level")}>
                {EDUCATION.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Profession <span className="text-slate-400 font-normal">(optional)</span></label>
            <input className="input" placeholder="e.g. Farmer, Teacher, Nurse" {...register("profession")} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Link to={isEdit && id ? `/residents/${id}` : "/residents"} className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={!isValid || submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create resident"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
