"use client";

import { useEffect, useState } from "react";
import { vendorsApi } from "@/lib/api";
import { Vendor } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

const EMPTY_FORM = { name: "", code: "", email: "", phone: "", address: "", isActive: true };

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = (p = page, s = search) => {
    setLoading(true);
    vendorsApi.list({ page: p, pageSize: 10, search: s || undefined }).then((res) => {
      if (res.success && res.data) {
        const d = res.data as unknown as { total: number; data: Vendor[] };
        setVendors(d.data);
        setTotal(d.total);
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(1, ""); setPage(1); }, []);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); load(1, val); };
  const handlePageChange = (p: number) => { setPage(p); load(p); };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (v: Vendor) => { setEditing(v); setForm({ name: v.name, code: v.code, email: v.email, phone: v.phone, address: v.address, isActive: v.isActive }); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true); setError("");
    const res = editing ? await vendorsApi.update(editing.id, form) : await vendorsApi.create(form);
    setSaving(false);
    if (res.success) { setModalOpen(false); load(); }
    else setError(res.message);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await vendorsApi.delete(deleteTarget.id);
    setDeleting(false);
    if (res.success) { setDeleteTarget(null); load(); }
    else { setError(res.message); setDeleteTarget(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">+ Add Vendor</button>
      </div>

      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={handleSearch} placeholder="Search vendors..." />
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {loading ? <LoadingSpinner /> : vendors.length === 0 ? <EmptyState title="No vendors" message="No vendors found." /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">{v.name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{v.code}</td>
                  <td className="px-4 py-3 text-gray-600">{v.email}</td>
                  <td className="px-4 py-3 text-gray-600">{v.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${v.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {v.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(v)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => setDeleteTarget(v)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} pageSize={10} onPageChange={handlePageChange} />
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Vendor" : "Add Vendor"}>
        <div className="space-y-4">
          {([
            { key: "name", label: "Name", inputType: "text" },
            { key: "code", label: "Code", inputType: "text" },
            { key: "email", label: "Email", inputType: "email" },
            { key: "phone", label: "Phone", inputType: "text" },
            { key: "address", label: "Address", inputType: "text" },
          ] as const).map(({ key, label, inputType }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={inputType} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Vendor" message={`Are you sure you want to delete "${deleteTarget?.name}"?`} loading={deleting} />
    </div>
  );
}
