"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { invoicesApi, vendorsApi, purchaseOrdersApi } from "@/lib/api";
import { Vendor, PurchaseOrder } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function NewInvoicePage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    invoiceNumber: "",
    vendorId: "",
    purchaseOrderId: "",
    totalAmount: 0,
    dueDate: "",
  });

  useEffect(() => {
    Promise.all([vendorsApi.list({ pageSize: 100 }), purchaseOrdersApi.list()]).then(([vRes, poRes]) => {
      if (vRes.success && vRes.data) setVendors((vRes.data as unknown as { data: Vendor[] }).data);
      if (poRes.success && poRes.data) {
        const all = poRes.data as unknown as PurchaseOrder[];
        setPos(all.filter((po) => po.status === "Issued" || po.status === "Confirmed" || po.status === "Completed"));
      }
      setLoading(false);
    });
  }, []);

  const handlePOChange = (poId: string) => {
    const po = pos.find((p) => p.id === poId);
    setForm({
      ...form,
      purchaseOrderId: poId,
      vendorId: po?.vendorId ?? form.vendorId,
      totalAmount: po?.totalAmount ?? form.totalAmount,
    });
  };

  const handleSubmit = async () => {
    if (!form.invoiceNumber || !form.vendorId || !form.purchaseOrderId || !form.totalAmount || !form.dueDate) {
      setError("All fields are required");
      return;
    }
    setSaving(true); setError("");
    const res = await invoicesApi.create({
      invoiceNumber: form.invoiceNumber,
      vendorId: form.vendorId,
      purchaseOrderId: form.purchaseOrderId,
      totalAmount: form.totalAmount,
      dueDate: new Date(form.dueDate).toISOString(),
    });
    setSaving(false);
    if (res.success && res.data) router.push(`/dashboard/invoices/${(res.data as unknown as { id: string }).id}`);
    else setError(res.message);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; Back</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Invoice</h1>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
            <input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="INV-20260918-0001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order *</label>
            <select value={form.purchaseOrderId} onChange={(e) => handlePOChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select PO</option>
              {pos.map((po) => (
                <option key={po.id} value={po.id}>{po.poNumber} - {po.vendorName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
            <select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select vendor</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
            <input type="number" min={0} value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Creating..." : "Create Invoice"}
        </button>
        <button onClick={() => router.back()} className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  );
}
