// src/pages/MarriageForm.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { marriageApi, villagesApi, clansApi } from "../api";
import { ApiRequestError } from "../api/client";
import { useToast } from "../components/Toast";
import type { Village, Clan } from "../types";

const schema = z.object({
  village_id: z.string().optional().or(z.literal("")),
  clan_id: z.string().optional().or(z.literal("")),
  husband_surname: z.string().max(200).optional().or(z.literal("")),
  husband_given_names: z.string().min(1, "Husband given names is required").max(200),
  wife_surname: z.string().max(200).optional().or(z.literal("")),
  wife_given_names: z.string().max(200).optional().or(z.literal("")),
  date_of_marriage: z.string().optional().or(z.literal("")),
  marriage_type: z.string().max(200).optional().or(z.literal("")),
  place_of_marriage: z.string().max(200).optional().or(z.literal("")),
  comments: z.string().max(500).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export default function MarriageForm() {
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
      husband_surname: "",
      husband_given_names: "",
      wife_surname: "",
      wife_given_names: "",
      date_of_marriage: "",
      marriage_type: "",
      place_of_marriage: "",
      comments: "",
    },
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    marriageApi.get(Number(id))
      .then((item) => {
        reset({
          village_id: item.village_id ? String(item.village_id) : "",
          clan_id: item.clan_id ? String(item.clan_id) : "",
          husband_surname: item.husband_surname ?? "",
          husband_given_names: item.husband_given_names ?? "",
          wife_surname: item.wife_surname ?? "",
          wife_given_names: item.wife_given_names ?? "",
          date_of_marriage: item.date_of_marriage ?? "",
          marriage_type: item.marriage_type ?? "",
          place_of_marriage: item.place_of_marriage ?? "",
          comments: item.comments ?? "",
        });
      })
      .catch(() => push("error", "Marriage not found"))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset, push]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    const payload = {
      village_id: values.village_id ? Number(values.village_id) : null,
      clan_id: values.clan_id ? Number(values.clan_id) : null,
      husband_surname: values.husband_surname || null,
      husband_given_names: values.husband_given_names,
      wife_surname: values.wife_surname || null,
      wife_given_names: values.wife_given_names || null,
      date_of_marriage: values.date_of_marriage ? values.date_of_marriage : null,
      marriage_type: values.marriage_type || null,
      place_of_marriage: values.place_of_marriage || null,
      comments: values.comments || null,
    };
    try {
      if (isEdit && id) {
        await marriageApi.update(Number(id), payload);
        push("success", "Marriage updated");
        navigate(`/marriages/${id}`);
      } else {
        const created = await marriageApi.create(payload);
        push("success", "Marriage created");
        navigate(`/marriages/${created.id}`);
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
        <h1 className="text-2xl font-bold">{isEdit ? "Edit marriage" : "New marriage"}</h1>
        <Link to={isEdit && id ? `/marriages/${id}` : "/marriages"} className="btn-ghost text-sm">Cancel</Link>
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
              <label className="label">Husband surname</label>
              <input className="input" {...register("husband_surname")} />
              {errors.husband_surname && <p className="field-error">{errors.husband_surname.message}</p>}
            </div>
            <div>
              <label className="label">Husband given names <span className="text-red-500">*</span></label>
              <input className="input" {...register("husband_given_names")} />
              {errors.husband_given_names && <p className="field-error">{errors.husband_given_names.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Wife surname</label>
              <input className="input" {...register("wife_surname")} />
              {errors.wife_surname && <p className="field-error">{errors.wife_surname.message}</p>}
            </div>
            <div>
              <label className="label">Wife given names</label>
              <input className="input" {...register("wife_given_names")} />
              {errors.wife_given_names && <p className="field-error">{errors.wife_given_names.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Date of marriage</label>
              <input type="date" className="input" {...register("date_of_marriage")} />
              {errors.date_of_marriage && <p className="field-error">{errors.date_of_marriage.message}</p>}
            </div>
            <div>
              <label className="label">Marriage type</label>
              <input className="input" {...register("marriage_type")} />
              {errors.marriage_type && <p className="field-error">{errors.marriage_type.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Place of marriage</label>
              <input className="input" {...register("place_of_marriage")} />
              {errors.place_of_marriage && <p className="field-error">{errors.place_of_marriage.message}</p>}
            </div>
            <div>
              <label className="label">Comments</label>
              <textarea className="input" rows={2} {...register("comments")} />
              {errors.comments && <p className="field-error">{errors.comments.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Link to={isEdit && id ? `/marriages/${id}` : "/marriages"} className="btn-secondary">Cancel</Link>
            <button type="submit" className="btn-primary" disabled={!isValid || submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create marriage"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
