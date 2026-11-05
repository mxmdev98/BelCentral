// src/pages/Residents.tsx
import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { residentsApi, villagesApi, tribesApi, clansApi } from "../api";
import type {
  PaginatedResidents, ResidentSearchParams,
  Village, Tribe, Clan,
  Gender, EmploymentStatus, MaritalStatus, EducationLevel,
} from "../types";
import { useAuth } from "../context/AuthContext";
import Pagination from "../components/Pagination";

const GENDERS: Gender[] = ["Male", "Female"];
const EMPLOYMENT: EmploymentStatus[] = ["Employed","Unemployed","Student","Retired","Self-Employed"];
const MARITAL: MaritalStatus[] = ["Single","Married","Widowed","Divorced","Separated"];
const EDUCATION: EducationLevel[] = ["None","Primary","Secondary","Vocational","Tertiary"];

export default function Residents() {
  const { can } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PaginatedResidents | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Independent dropdown lists — loaded once, no cascading.
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

  // Filters — sourced from URL so refresh keeps state.
  const q        = searchParams.get("q") ?? "";
  const father   = searchParams.get("father") ?? "";
  const mother   = searchParams.get("mother") ?? "";
  const villageId = searchParams.get("village_id") ? Number(searchParams.get("village_id")) : "";
  const tribeId   = searchParams.get("tribe_id")   ? Number(searchParams.get("tribe_id"))   : "";
  const clanId    = searchParams.get("clan_id")    ? Number(searchParams.get("clan_id"))    : "";
  const gender    = (searchParams.get("gender") as Gender | "") || "";
  const employment = (searchParams.get("employment_status") as EmploymentStatus | "") || "";
  const marital   = (searchParams.get("marital_status") as MaritalStatus | "") || "";
  const education = (searchParams.get("education_level") as EducationLevel | "") || "";
  const page = Number(searchParams.get("page") ?? "1");
  const limit = 25;

  const setParam = useCallback(
    (key: string, value: string | number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === "" || value === null) next.delete(key);
        else next.set(key, String(value));
        if (key !== "page") next.delete("page");
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  // Debounced fetch
  useEffect(() => {
    const params: ResidentSearchParams = { page, limit };
    if (q) params.q = q;
    if (father) params.father = father;
    if (mother) params.mother = mother;
    if (villageId) params.village_id = Number(villageId);
    if (tribeId) params.tribe_id = Number(tribeId);
    if (clanId) params.clan_id = Number(clanId);
    if (gender) params.gender = gender as Gender;
    if (employment) params.employment_status = employment as EmploymentStatus;
    if (marital) params.marital_status = marital as MaritalStatus;
    if (education) params.education_level = education as EducationLevel;

    setLoading(true);
    const id = setTimeout(() => {
      residentsApi.list(params)
        .then((r) => {
          setData(r);
          setError(null);
        })
        .catch((err) => {
          console.error("[Residents fetch] failed:", err);
          setError(err instanceof Error ? err.message : "Failed to load residents");
          setData(null);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(id);
  }, [q, father, mother, villageId, tribeId, clanId, gender, employment, marital, education, page]);

  function resetFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  // Coerce to strings for <select value=...>
  const vStr = villageId ? String(villageId) : "";
  const tStr = tribeId ? String(tribeId) : "";
  const cStr = clanId ? String(clanId) : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Residents</h1>
        {can("residents", "create") && (
          <Link to="/residents/new" className="btn-primary">+ New resident</Link>
        )}
      </div>

      {/* Search + filters */}
      <div className="card">
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                placeholder="Search by full / father / mother name"
                value={q}
                onChange={(e) => setParam("q", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Father's name</label>
              <input
                className="input"
                value={father}
                onChange={(e) => setParam("father", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Mother's name</label>
              <input
                className="input"
                value={mother}
                onChange={(e) => setParam("mother", e.target.value)}
              />
            </div>
          </div>

          {/* Village / Tribe / Clan — independent (not cascading) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label" htmlFor="filter-village">Village</label>
              <select
                id="filter-village"
                className="input"
                value={vStr}
                onChange={(e) => setParam("village_id", e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Any</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter-tribe">Tribe</label>
              <select
                id="filter-tribe"
                className="input"
                value={tStr}
                onChange={(e) => setParam("tribe_id", e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Any</option>
                {tribes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter-clan">Clan</label>
              <select
                id="filter-clan"
                className="input"
                value={cStr}
                onChange={(e) => setParam("clan_id", e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Any</option>
                {clans.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="label">Gender</label>
              <select className="input" value={gender}
                onChange={(e) => setParam("gender", e.target.value)}>
                <option value="">Any</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Employment</label>
              <select className="input" value={employment}
                onChange={(e) => setParam("employment_status", e.target.value)}>
                <option value="">Any</option>
                {EMPLOYMENT.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Marital</label>
              <select className="input" value={marital}
                onChange={(e) => setParam("marital_status", e.target.value)}>
                <option value="">Any</option>
                {MARITAL.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Education</label>
              <select className="input" value={education}
                onChange={(e) => setParam("education_level", e.target.value)}>
                <option value="">Any</option>
                {EDUCATION.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button onClick={resetFilters} className="btn-ghost text-sm">Reset filters</button>
            {loading && <span className="text-xs text-slate-500">Searching…</span>}
          </div>
        </div>
      </div>

      {error && (
        <div className="card">
          <div className="card-body">
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
              Error loading residents: {error}
            </div>
          </div>
        </div>
      )}

      {/* Results table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Full name</th>
                <th className="px-4 py-3 font-semibold">Gender</th>
                <th className="px-4 py-3 font-semibold">Age</th>
                <th className="px-4 py-3 font-semibold">Village</th>
                <th className="px-4 py-3 font-semibold">Tribe / Clan</th>
                <th className="px-4 py-3 font-semibold">Employment</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.items.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/residents/${r.id}`} className="font-medium text-brand-700 hover:underline">
                      {r.full_name}
                    </Link>
                    <div className="text-xs text-slate-500">DOB: {r.date_of_birth}</div>
                  </td>
                  <td className="px-4 py-3">{r.gender}</td>
                  <td className="px-4 py-3">{r.age}</td>
                  <td className="px-4 py-3">{r.village_name}</td>
                  <td className="px-4 py-3">
                    <div>{r.tribe_name}</div>
                    <div className="text-xs text-slate-500">{r.clan_name}</div>
                  </td>
                  <td className="px-4 py-3">{r.employment_status}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {can("residents", "update") && (
                      <Link to={`/residents/${r.id}/edit`} className="text-brand-700 hover:underline mr-3">
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {data && data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No residents match your filters.
                  </td>
                </tr>
              )}
              {!data && !error && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
          {data && (
            <Pagination
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPage={(p) => setParam("page", p)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
