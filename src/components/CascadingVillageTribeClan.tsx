// src/components/CascadingVillageTribeClan.tsx — 3-level cascading selector.
// Selecting a village fetches its tribes; selecting a tribe fetches its clans.
// Used by ResidentForm (controlled) and Residents list (filters, uncontrolled).
//
// Uses NATIVE <select> elements (no appearance-none / custom chevron) because
// native selects trigger the OS-native picker on iOS/Android, which is the
// most reliable touch UX. Custom chevrons overlaid on selects can intercept
// touch events on some mobile browsers and prevent option selection.
import { useEffect, useState } from "react";
import { villagesApi, tribesApi, clansApi } from "../api";
import type { Village, Tribe, Clan } from "../types";

interface Props {
  villageId?: number | "";
  tribeId?: number | "";
  clanId?: number | "";
  onVillageChange: (id: number | "") => void;
  onTribeChange: (id: number | "") => void;
  onClanChange: (id: number | "") => void;
  required?: boolean;
}

export default function CascadingVillageTribeClan({
  villageId, tribeId, clanId,
  onVillageChange, onTribeChange, onClanChange,
  required = true,
}: Props) {
  const [villages, setVillages] = useState<Village[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [clans, setClans] = useState<Clan[]>([]);
  const [loadingTribes, setLoadingTribes] = useState(false);
  const [loadingClans, setLoadingClans] = useState(false);

  useEffect(() => {
    villagesApi.list().then((r) => setVillages(r.items));
  }, []);

  useEffect(() => {
    if (!villageId) { setTribes([]); setClans([]); return; }
    setLoadingTribes(true);
    tribesApi.list(Number(villageId))
      .then((r) => setTribes(r.items))
      .finally(() => setLoadingTribes(false));
  }, [villageId]);

  useEffect(() => {
    if (!tribeId) { setClans([]); return; }
    setLoadingClans(true);
    clansApi.list(Number(tribeId))
      .then((r) => setClans(r.items))
      .finally(() => setLoadingClans(false));
  }, [tribeId]);

  // Coerce values to strings so the select always finds a matching <option>.
  // (React compares value prop to option value attr as strings.)
  const vStr = villageId ? String(villageId) : "";
  const tStr = tribeId ? String(tribeId) : "";
  const cStr = clanId ? String(clanId) : "";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* Village */}
      <div className="min-w-0">
        <label className="label">
          Village {required && <span className="text-red-500">*</span>}
        </label>
        <select
          className="input"
          value={vStr}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : "";
            onVillageChange(v);
            onTribeChange("");
            onClanChange("");
          }}
        >
          <option value="">— Select village —</option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* Tribe */}
      <div className="min-w-0">
        <label className="label flex items-center gap-1">
          <span>Tribe {required && <span className="text-red-500">*</span>}</span>
          {(!villageId || loadingTribes) && (
            <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-400 font-normal">
              {loadingTribes ? "loading" : "locked"}
            </span>
          )}
        </label>
        <select
          className="input disabled:bg-slate-100 disabled:text-slate-500"
          value={tStr}
          disabled={!villageId || loadingTribes}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : "";
            onTribeChange(v);
            onClanChange("");
          }}
        >
          <option value="">
            {!villageId ? "— Select village first —" :
             loadingTribes ? "Loading…" : "— Select tribe —"}
          </option>
          {tribes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Clan */}
      <div className="min-w-0">
        <label className="label flex items-center gap-1">
          <span>Clan {required && <span className="text-red-500">*</span>}</span>
          {(!tribeId || loadingClans) && (
            <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-400 font-normal">
              {loadingClans ? "loading" : "locked"}
            </span>
          )}
        </label>
        <select
          className="input disabled:bg-slate-100 disabled:text-slate-500"
          value={cStr}
          disabled={!tribeId || loadingClans}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : "";
            onClanChange(v);
          }}
        >
          <option value="">
            {!tribeId ? "— Select tribe first —" :
             loadingClans ? "Loading…" : "— Select clan —"}
          </option>
          {clans.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
