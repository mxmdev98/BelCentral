// src/pages/TribesClans.tsx — combined CRUD for tribes and clans (land registry).
import { useEffect, useState } from "react";
import { villagesApi, tribesApi, clansApi } from "../api";
import { ApiRequestError } from "../api/client";
import type { Village, Tribe, Clan } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";

interface TribeWithCounts extends Tribe {
  clan_count: number;
  village_name: string;
}
interface ClanDetail extends Clan {
  tribe_name: string;
  village_name: string;
}

export default function TribesClans() {
  const { isAdmin } = useAuth();
  const { push } = useToast();

  const [villages, setVillages] = useState<Village[]>([]);
  const [tribes, setTribes] = useState<TribeWithCounts[]>([]);
  const [clans, setClans] = useState<ClanDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // tribe modal state
  const [tribeModal, setTribeModal] = useState<{
    editing: Tribe | null;
    villageId: number | "";
    name: string;
  } | null>(null);
  const [savingTribe, setSavingTribe] = useState(false);

  // clan modal state
  const [clanModal, setClanModal] = useState<{
    editing: Clan | null;
    villageId: number | "";
    tribeId: number | "";
    name: string;
  } | null>(null);
  const [savingClan, setSavingClan] = useState(false);

  // delete state
  const [deleteTribe, setDeleteTribe] = useState<TribeWithCounts | null>(null);
  const [deleteClan, setDeleteClan] = useState<ClanDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters for the clans table (cascade: village -> tribe)
  const [clanVillageFilter, setClanVillageFilter] = useState<number | "">("");
  const [clanTribeFilter, setClanTribeFilter] = useState<number | "">("");

  function load() {
    Promise.all([villagesApi.list(), tribesApi.list(), clansApi.list()])
      .then(([v, t, c]) => {
        setVillages(v.items);
        const villageName = (id: number) => v.items.find((x) => x.id === id)?.name ?? "—";
        // clan count per tribe
        const clanCountByTribe = new Map<number, number>();
        for (const cl of c.items) {
          clanCountByTribe.set(cl.tribe_id, (clanCountByTribe.get(cl.tribe_id) ?? 0) + 1);
        }
        setTribes(
          t.items
            .map((tr) => ({
              ...tr,
              clan_count: clanCountByTribe.get(tr.id) ?? 0,
              village_name: villageName(tr.village_id),
            }))
            .sort((a, b) => a.village_name.localeCompare(b.village_name) || a.name.localeCompare(b.name))
        );
        setClans(
          c.items
            .map((cl) => {
              const tr = t.items.find((x) => x.id === cl.tribe_id);
              return {
                ...cl,
                tribe_name: tr?.name ?? "—",
                village_name: tr ? villageName(tr.village_id) : "—",
              };
            })
            .sort(
              (a, b) =>
                a.village_name.localeCompare(b.village_name) ||
                a.tribe_name.localeCompare(b.tribe_name) ||
                a.name.localeCompare(b.name)
            )
        );
      })
      .catch(() => push("error", "Failed to load tribes and clans"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [push]);

  function villageName(id: number) {
    return villages.find((v) => v.id === id)?.name ?? "—";
  }

  // ---- Tribe CRUD ----
  function openAddTribe() {
    setTribeModal({ editing: null, villageId: villages[0]?.id ?? "", name: "" });
  }
  function openEditTribe(t: TribeWithCounts) {
    setTribeModal({ editing: t, villageId: t.village_id, name: t.name });
  }
  async function saveTribe() {
    if (!tribeModal) return;
    const { editing, villageId, name } = tribeModal;
    const trimmed = name.trim();
    if (!trimmed) return push("error", "Tribe name is required");
    if (!villageId) return push("error", "Select a village");
    setSavingTribe(true);
    try {
      if (editing) {
        await tribesApi.update(editing.id, Number(villageId), trimmed);
        push("success", "Tribe updated");
      } else {
        await tribesApi.create(Number(villageId), trimmed);
        push("success", "Tribe created");
      }
      setTribeModal(null);
      load();
    } catch (e) {
      push("error", e instanceof ApiRequestError ? e.message : "Save failed");
    } finally {
      setSavingTribe(false);
    }
  }
  async function handleDeleteTribe() {
    if (!deleteTribe) return;
    setDeleting(true);
    try {
      await tribesApi.delete(deleteTribe.id);
      push("success", "Tribe deleted");
      setDeleteTribe(null);
      load();
    } catch (e) {
      const msg =
        e instanceof ApiRequestError && e.status === 400
          ? `Cannot delete "${deleteTribe.name}": clans or residents still reference it. Remove those first.`
          : e instanceof ApiRequestError
            ? e.message
            : "Delete failed";
      push("error", msg);
    } finally {
      setDeleting(false);
    }
  }

  // ---- Clan CRUD ----
  function openAddClan() {
    setClanModal({
      editing: null,
      villageId: "",
      tribeId: "",
      name: "",
    });
  }
  function openEditClan(c: ClanDetail) {
    const t = tribes.find((tr) => tr.id === c.tribe_id);
    setClanModal({
      editing: c,
      villageId: t?.village_id ?? "",
      tribeId: c.tribe_id,
      name: c.name,
    });
  }
  async function saveClan() {
    if (!clanModal) return;
    const { editing, tribeId, name } = clanModal;
    const trimmed = name.trim();
    if (!trimmed) return push("error", "Clan name is required");
    if (!tribeId) return push("error", "Select a tribe");
    setSavingClan(true);
    try {
      if (editing) {
        await clansApi.update(editing.id, Number(tribeId), trimmed);
        push("success", "Clan updated");
      } else {
        await clansApi.create(Number(tribeId), trimmed);
        push("success", "Clan created");
      }
      setClanModal(null);
      load();
    } catch (e) {
      push("error", e instanceof ApiRequestError ? e.message : "Save failed");
    } finally {
      setSavingClan(false);
    }
  }
  async function handleDeleteClan() {
    if (!deleteClan) return;
    setDeleting(true);
    try {
      await clansApi.delete(deleteClan.id);
      push("success", "Clan deleted");
      setDeleteClan(null);
      load();
    } catch (e) {
      const msg =
        e instanceof ApiRequestError && e.status === 400
          ? `Cannot delete "${deleteClan.name}": residents still reference it. Remove or reassign them first.`
          : e instanceof ApiRequestError
            ? e.message
            : "Delete failed";
      push("error", msg);
    } finally {
      setDeleting(false);
    }
  }

  // tribes filtered for the clan modal/form by selected village
  const tribesForClanForm = tribeModal
    ? tribes.filter((t) => tribeModal.villageId === "" || t.village_id === Number(tribeModal.villageId))
    : [];
  // tribes filtered for the clans table by the village filter
  const tribesForTableFilter = tribes.filter(
    (t) => clanVillageFilter === "" || t.village_id === Number(clanVillageFilter)
  );
  const filteredClans = clans.filter(
    (c) =>
      (clanVillageFilter === "" || c.village_name === villageName(Number(clanVillageFilter))) &&
      (clanTribeFilter === "" || c.tribe_id === Number(clanTribeFilter))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tribes & Clans</h1>
        <p className="text-sm text-slate-500">Land registry — manage tribes (within villages) and clans (within tribes).</p>
      </div>

      {/* ---- TRIBES ---- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold">Tribes</h2>
          {isAdmin && (
            <button onClick={openAddTribe} className="btn-primary">+ New tribe</button>
          )}
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Village</th>
                  <th className="px-4 py-3 font-semibold">Tribe</th>
                  <th className="px-4 py-3 font-semibold">Clans</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tribes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{t.village_name}</td>
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3">{t.clan_count}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isAdmin && (
                        <>
                          <button onClick={() => openEditTribe(t)} className="text-brand-700 hover:underline mr-3">
                            Edit
                          </button>
                          <button onClick={() => setDeleteTribe(t)} className="text-red-600 hover:underline">
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {tribes.length === 0 && !loading && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">No tribes yet.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---- CLANS ---- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold">Clans</h2>
          {isAdmin && (
            <button onClick={openAddClan} className="btn-primary">+ New clan</button>
          )}
        </div>
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Filter by village</label>
                <select
                  className="input"
                  value={clanVillageFilter}
                  onChange={(e) => {
                    setClanVillageFilter(e.target.value ? Number(e.target.value) : "");
                    setClanTribeFilter("");
                  }}
                >
                  <option value="">All villages</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Filter by tribe</label>
                <select
                  className="input"
                  value={clanTribeFilter}
                  onChange={(e) => setClanTribeFilter(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">All tribes</option>
                  {tribesForTableFilter.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Village</th>
                  <th className="px-4 py-3 font-semibold">Tribe</th>
                  <th className="px-4 py-3 font-semibold">Clan</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClans.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{c.village_name}</td>
                    <td className="px-4 py-3">{c.tribe_name}</td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isAdmin && (
                        <>
                          <button onClick={() => openEditClan(c)} className="text-brand-700 hover:underline mr-3">
                            Edit
                          </button>
                          <button onClick={() => setDeleteClan(c)} className="text-red-600 hover:underline">
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredClans.length === 0 && !loading && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">No clans found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Tribe add/edit modal */}
      <Modal
        open={tribeModal !== null}
        title={tribeModal?.editing ? "Edit tribe" : "New tribe"}
        onClose={() => setTribeModal(null)}
        footer={
          <>
            <button onClick={() => setTribeModal(null)} className="btn-secondary" disabled={savingTribe}>
              Cancel
            </button>
            <button onClick={saveTribe} className="btn-primary" disabled={savingTribe}>
              {savingTribe ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Village</label>
            <select
              className="input"
              value={tribeModal?.villageId ?? ""}
              onChange={(e) =>
                setTribeModal((m) => (m ? { ...m, villageId: e.target.value ? Number(e.target.value) : "" } : m))
              }
            >
              <option value="">Select village…</option>
              {villages.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tribe name</label>
            <input
              className="input"
              placeholder="e.g. Gambina"
              value={tribeModal?.name ?? ""}
              onChange={(e) => setTribeModal((m) => (m ? { ...m, name: e.target.value } : m))}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") saveTribe(); }}
            />
          </div>
        </div>
      </Modal>

      {/* Clan add/edit modal */}
      <Modal
        open={clanModal !== null}
        title={clanModal?.editing ? "Edit clan" : "New clan"}
        onClose={() => setClanModal(null)}
        footer={
          <>
            <button onClick={() => setClanModal(null)} className="btn-secondary" disabled={savingClan}>
              Cancel
            </button>
            <button onClick={saveClan} className="btn-primary" disabled={savingClan}>
              {savingClan ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Village</label>
            <select
              className="input"
              value={clanModal?.villageId ?? ""}
              onChange={(e) =>
                setClanModal((m) =>
                  m ? { ...m, villageId: e.target.value ? Number(e.target.value) : "", tribeId: "" } : m
                )
              }
            >
              <option value="">Select village…</option>
              {villages.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tribe</label>
            <select
              className="input"
              value={clanModal?.tribeId ?? ""}
              onChange={(e) =>
                setClanModal((m) => (m ? { ...m, tribeId: e.target.value ? Number(e.target.value) : "" } : m))
              }
            >
              <option value="">Select tribe…</option>
              {tribesForClanForm.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Clan name</label>
            <input
              className="input"
              placeholder="e.g. Wagunika"
              value={clanModal?.name ?? ""}
              onChange={(e) => setClanModal((m) => (m ? { ...m, name: e.target.value } : m))}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") saveClan(); }}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTribe !== null}
        title={`Delete tribe "${deleteTribe?.name ?? ""}"?`}
        message="This permanently removes the tribe. It will be blocked if clans or residents reference it."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteTribe}
        onCancel={() => setDeleteTribe(null)}
      />
      <ConfirmDialog
        open={deleteClan !== null}
        title={`Delete clan "${deleteClan?.name ?? ""}"?`}
        message="This permanently removes the clan. It will be blocked if residents reference it."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteClan}
        onCancel={() => setDeleteClan(null)}
      />
    </div>
  );
}
