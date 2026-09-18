"use client";

import { useEffect, useState } from "react";
import { usersApi, departmentsApi } from "@/lib/api";
import { User, Department } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

const ROLES = ["OWNER", "ADMIN", "EMPLOYEE", "MANAGER", "PROCUREMENT", "WAREHOUSE", "FINANCE"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE", departmentId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [actionTarget, setActionTarget] = useState<{ user: User; action: "activate" | "deactivate" | "role" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [roleForm, setRoleForm] = useState("");

  const load = () => {
    Promise.all([usersApi.list(), departmentsApi.list()]).then(([uRes, dRes]) => {
      if (uRes.success && uRes.data) setUsers(uRes.data as unknown as User[]);
      if (dRes.success && dRes.data) setDepartments(dRes.data as unknown as Department[]);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    const res = await usersApi.create({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role || undefined,
      departmentId: form.departmentId || undefined,
    });
    setSaving(false);
    if (res.success) { setModalOpen(false); setForm({ name: "", email: "", password: "", role: "EMPLOYEE", departmentId: "" }); load(); }
    else setError(res.message);
  };

  const handleAction = async () => {
    if (!actionTarget) return;
    setActionLoading(true);
    let res;
    if (actionTarget.action === "activate") res = await usersApi.activate(actionTarget.user.id);
    else if (actionTarget.action === "deactivate") res = await usersApi.deactivate(actionTarget.user.id);
    else res = await usersApi.updateRole(actionTarget.user.id, roleForm);
    setActionLoading(false);
    if (res.success) { setActionTarget(null); load(); }
    else { setError(res.message); setActionTarget(null); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          + Add User
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {users.length === 0 ? <EmptyState title="No users" message="Create your first user." /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.departmentName ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => { setRoleForm(u.role); setActionTarget({ user: u, action: "role" }); }} className="text-blue-600 hover:underline text-xs">Role</button>
                    <button onClick={() => setActionTarget({ user: u, action: u.isActive ? "deactivate" : "activate" })} className={`hover:underline text-xs ${u.isActive ? "text-orange-600" : "text-green-600"}`}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">None</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!actionTarget && actionTarget.action === "role"}
        onClose={() => setActionTarget(null)}
        onConfirm={handleAction}
        title="Update Role"
        confirmLabel="Update"
        loading={actionLoading}
        message=""
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">New Role for {actionTarget?.user.name}</label>
          <select value={roleForm} onChange={(e) => setRoleForm(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!actionTarget && (actionTarget.action === "activate" || actionTarget.action === "deactivate")}
        onClose={() => setActionTarget(null)}
        onConfirm={handleAction}
        title={actionTarget?.action === "activate" ? "Activate User" : "Deactivate User"}
        message={`Are you sure you want to ${actionTarget?.action} "${actionTarget?.user.name}"?`}
        confirmLabel={actionTarget?.action === "activate" ? "Activate" : "Deactivate"}
        loading={actionLoading}
      />
    </div>
  );
}
