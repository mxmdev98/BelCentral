// src/pages/Admin.tsx — admin panel: user management + permissions matrix
import { useEffect, useState } from "react";
import { usersApi, permissionsApi } from "../api";
import type { UserWithPermissions } from "../types";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

const RESOURCES = ["residents", "ward_officials"] as const;
const RESOURCE_LABELS: Record<string, string> = {
  residents: "Residents",
  ward_officials: "Ward Officials",
};

// Type for the local draft state: map of "userId:resource" -> {can_read, can_create, can_update}
type PermDraftKey = string; // `${userId}:${resource}`
interface PermDraftValue {
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
}

type Tab = "users" | "permissions";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  // New user form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"official" | "admin">("official");
  const [creating, setCreating] = useState(false);

  // Reset password dialog
  const [resetUser, setResetUser] = useState<UserWithPermissions | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Delete confirm
  const [deleteUser, setDeleteUser] = useState<UserWithPermissions | null>(null);

  // Permissions matrix edit mode + draft state
  const [permEditMode, setPermEditMode] = useState(false);
  const [permDraft, setPermDraft] = useState<Record<PermDraftKey, PermDraftValue>>({});
  const [savingPerms, setSavingPerms] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const r = await permissionsApi.list();
      setUsers(r.items);
    } catch {
      push("error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleCreate() {
    if (!newUsername || !newPassword) return;
    setCreating(true);
    try {
      await usersApi.create(newUsername, newPassword, newRole);
      push("success", `User '${newUsername}' created`);
      setNewUsername("");
      setNewPassword("");
      setNewRole("official");
      await loadUsers();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(u: UserWithPermissions) {
    try {
      await usersApi.toggleActive(u.id, !u.is_active);
      push("success", `${u.username} ${u.is_active ? "disabled" : "enabled"}`);
      await loadUsers();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Toggle failed");
    }
  }

  async function handleResetPassword() {
    if (!resetUser || !resetPassword) return;
    setResetting(true);
    try {
      await usersApi.resetPassword(resetUser.id, resetPassword);
      push("success", `Password reset for ${resetUser.username}`);
      setResetUser(null);
      setResetPassword("");
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    try {
      await usersApi.remove(deleteUser.id);
      push("success", `User '${deleteUser.username}' deleted`);
      setDeleteUser(null);
      await loadUsers();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Delete failed");
    }
  }

  // ---- Permissions matrix: edit / save flow ----

  // Enter edit mode: snapshot current permissions into a draft
  function startEdit() {
    const draft: Record<PermDraftKey, PermDraftValue> = {};
    for (const u of users) {
      for (const r of RESOURCES) {
        const perm = u.permissions.find((p) => p.resource === r);
        draft[`${u.id}:${r}`] = {
          can_read: perm?.can_read ?? false,
          can_create: perm?.can_create ?? false,
          can_update: perm?.can_update ?? false,
        };
      }
    }
    setPermDraft(draft);
    setPermEditMode(true);
  }

  // Cancel edit: discard draft, exit edit mode
  function cancelEdit() {
    setPermDraft({});
    setPermEditMode(false);
  }

  // Toggle a single checkbox in the draft
  function toggleDraftPerm(userId: number, resource: string, action: "can_read" | "can_create" | "can_update") {
    const key = `${userId}:${resource}`;
    setPermDraft((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [action]: !prev[key][action],
      },
    }));
  }

  // Save all permission changes, then exit edit mode + show confirmation
  async function savePerms() {
    setSavingPerms(true);
    let successCount = 0;
    let failCount = 0;

    for (const u of users) {
      // Skip admins (they bypass perms) and disabled users
      if (u.role === "admin" || !u.is_active) continue;
      for (const r of RESOURCES) {
        const key = `${u.id}:${r}`;
        const draft = permDraft[key];
        if (!draft) continue;
        try {
          await permissionsApi.upsert(u.id, {
            resource: r,
            can_read: draft.can_read,
            can_create: draft.can_create,
            can_update: draft.can_update,
          });
          successCount++;
        } catch {
          failCount++;
        }
      }
    }

    setSavingPerms(false);
    setPermEditMode(false);
    setPermDraft({});

    if (failCount === 0) {
      push("success", `Permissions saved successfully (${successCount} permission${successCount === 1 ? "" : "s"} updated).`);
    } else {
      push("error", `Saved ${successCount} permission(s), but ${failCount} failed. Check the console for details.`);
    }

    // Reload to reflect the saved state
    await loadUsers();
  }

  if (loading) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === "users" ? "border-brand-600 text-brand-700" : "border-transparent text-slate-600 hover:text-slate-800"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setTab("permissions")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === "permissions" ? "border-brand-600 text-brand-700" : "border-transparent text-slate-600 hover:text-slate-800"
          }`}
        >
          Permissions
        </button>
      </div>

      {tab === "users" && (
        <div className="space-y-4">
          {/* Create new user — stacked layout so the button is always visible */}
          <div className="card">
            <div className="card-body">
              <h2 className="font-semibold mb-3">Create new user</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label">Username</label>
                    <input
                      className="input"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. joe.official"
                    />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input
                      className="input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                    />
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select
                      className="input"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as "official" | "admin")}
                    >
                      <option value="official">Official</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleCreate}
                    className="btn-primary"
                    disabled={!newUsername || !newPassword || creating}
                  >
                    {creating ? "Creating…" : "+ Create user"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Users list */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Username</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{u.username}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.role === "admin" ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-600"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="badge bg-green-100 text-green-800">Active</span>
                        ) : (
                          <span className="badge bg-red-100 text-red-800">Disabled</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setResetUser(u)}
                          className="text-brand-700 hover:underline mr-3"
                        >
                          Reset password
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="text-slate-600 hover:underline mr-3"
                        >
                          {u.is_active ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => setDeleteUser(u)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "permissions" && (
        <div className="card overflow-hidden">
          <div className="card-body">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
              <div>
                <h2 className="font-semibold">Permission Matrix</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Grant officials read / create / update access per table. Admins always have full access.
                  <strong> Delete is admin-only</strong> — no permission row exists for it.
                </p>
              </div>
              {/* Edit / Save / Cancel buttons */}
              <div className="flex gap-2">
                {!permEditMode ? (
                  <button onClick={startEdit} className="btn-primary">
                    Edit permissions
                  </button>
                ) : (
                  <>
                    <button onClick={cancelEdit} className="btn-secondary" disabled={savingPerms}>
                      Cancel
                    </button>
                    <button onClick={savePerms} className="btn-primary" disabled={savingPerms}>
                      {savingPerms ? "Saving…" : "Save permissions"}
                    </button>
                  </>
                )}
              </div>
            </div>
            {!permEditMode && (
              <p className="text-xs text-slate-400 mt-2">
                Click "Edit permissions" to modify the checkboxes below.
              </p>
            )}
            {permEditMode && (
              <p className="text-xs text-brand-600 mt-2">
                Editing mode — changes are not saved until you click "Save permissions".
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  {RESOURCES.map((r) => (
                    <th key={r} className="px-4 py-3 font-semibold text-center" colSpan={3}>
                      {RESOURCE_LABELS[r]}
                    </th>
                  ))}
                </tr>
                <tr className="border-t border-slate-100">
                  <th></th>
                  {RESOURCES.map((r) => (
                    <>
                      <th key={`${r}-r`} className="px-2 py-2 text-xs text-center font-normal text-slate-500">Read</th>
                      <th key={`${r}-c`} className="px-2 py-2 text-xs text-center font-normal text-slate-500">Create</th>
                      <th key={`${r}-u`} className="px-2 py-2 text-xs text-center font-normal text-slate-500">Update</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.username}</div>
                      <div className="text-xs text-slate-500">
                        {u.role === "admin" ? "Admin (full access)" : "Official"}
                        {!u.is_active && " · disabled"}
                      </div>
                    </td>
                    {RESOURCES.map((r) => {
                      const perm = u.permissions.find((p) => p.resource === r);
                      const key = `${u.id}:${r}`;
                      const isAdminOrDisabled = u.role === "admin" || !u.is_active;
                      // In edit mode, read from draft; otherwise from saved perms
                      const readVal = permEditMode && !isAdminOrDisabled
                        ? (permDraft[key]?.can_read ?? false)
                        : (u.role === "admin" ? true : (perm?.can_read ?? false));
                      const createVal = permEditMode && !isAdminOrDisabled
                        ? (permDraft[key]?.can_create ?? false)
                        : (u.role === "admin" ? true : (perm?.can_create ?? false));
                      const updateVal = permEditMode && !isAdminOrDisabled
                        ? (permDraft[key]?.can_update ?? false)
                        : (u.role === "admin" ? true : (perm?.can_update ?? false));
                      // Checkboxes are disabled when NOT in edit mode (read-only),
                      // or when the user is admin/disabled (can't change those)
                      const checkboxDisabled = !permEditMode || isAdminOrDisabled;
                      return (
                        <>
                          <td key={`${u.id}-${r}-r`} className="px-2 py-3 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={readVal}
                              disabled={checkboxDisabled}
                              onChange={() => toggleDraftPerm(u.id, r, "can_read")}
                            />
                          </td>
                          <td key={`${u.id}-${r}-c`} className="px-2 py-3 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={createVal}
                              disabled={checkboxDisabled}
                              onChange={() => toggleDraftPerm(u.id, r, "can_create")}
                            />
                          </td>
                          <td key={`${u.id}-${r}-u`} className="px-2 py-3 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={updateVal}
                              disabled={checkboxDisabled}
                              onChange={() => toggleDraftPerm(u.id, r, "can_update")}
                            />
                          </td>
                        </>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset password dialog */}
      <ConfirmDialog
        open={resetUser !== null}
        title={`Reset password for ${resetUser?.username ?? ""}`}
        message={
          <div className="space-y-2">
            <p>Enter a new password (min 6 characters):</p>
            <input
              className="input"
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="New password"
              autoFocus
            />
          </div>
        }
        confirmLabel="Reset password"
        onConfirm={handleResetPassword}
        onCancel={() => { setResetUser(null); setResetPassword(""); }}
        loading={resetting}
      />

      {/* Delete user dialog */}
      <ConfirmDialog
        open={deleteUser !== null}
        title="Delete user?"
        message={`This will permanently delete '${deleteUser?.username}'. They will no longer be able to log in.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteUser(null)}
      />
    </div>
  );
}
