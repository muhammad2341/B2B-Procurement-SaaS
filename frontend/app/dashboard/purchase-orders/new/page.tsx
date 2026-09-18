"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { purchaseOrdersApi, vendorsApi, productsApi, purchaseRequestsApi } from "@/lib/api";
import { Vendor, Product, PurchaseRequest } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface LineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [approvedPRs, setApprovedPRs] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"manual" | "fromPR">("manual");
  const [form, setForm] = useState({ vendorId: "", purchaseRequestId: "" });
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: 1, unitPrice: 0 }]);

  useEffect(() => {
    Promise.all([
      vendorsApi.list({ pageSize: 100 }),
      productsApi.list({ pageSize: 100 }),
      purchaseRequestsApi.list(),
    ]).then(([vRes, pRes, prRes]) => {
      if (vRes.success && vRes.data) setVendors((vRes.data as unknown as { data: Vendor[] }).data);
      if (pRes.success && pRes.data) setProducts((pRes.data as unknown as { data: Product[] }).data);
      if (prRes.success && prRes.data) {
        const all = prRes.data as unknown as PurchaseRequest[];
        setApprovedPRs(all.filter((pr) => pr.status === "Approved"));
      }
      setLoading(false);
    });
  }, []);

  const addItem = () => setItems([...items, { productId: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [field]: value };
    setItems(copy);
  };

  const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);

  const handleSubmit = async () => {
    if (!form.vendorId) { setError("Vendor is required"); return; }
    setSaving(true); setError("");

    let res;
    if (mode === "fromPR" && form.purchaseRequestId) {
      res = await purchaseOrdersApi.createFromRequest(form.purchaseRequestId, form.vendorId);
    } else {
      if (items.some((it) => !it.productId || it.quantity <= 0)) { setError("Fill all product and quantity fields"); setSaving(false); return; }
      res = await purchaseOrdersApi.create({
        vendorId: form.vendorId,
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity, unitPrice: it.unitPrice })),
      });
    }

    setSaving(false);
    if (res.success && res.data) router.push(`/dashboard/purchase-orders/${(res.data as unknown as { id: string }).id}`);
    else setError(res.message);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; Back</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Purchase Order</h1>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <button onClick={() => setMode("manual")} className={`px-4 py-2 text-sm font-medium rounded-lg ${mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Manual
          </button>
          <button onClick={() => setMode("fromPR")} className={`px-4 py-2 text-sm font-medium rounded-lg ${mode === "fromPR" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            From Purchase Request
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
            <select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select vendor</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          {mode === "fromPR" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Request *</label>
              <select value={form.purchaseRequestId} onChange={(e) => setForm({ ...form, purchaseRequestId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select PR</option>
                {approvedPRs.map((pr) => <option key={pr.id} value={pr.id}>{pr.requestNumber} - {fmt(pr.totalAmount)}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {mode === "manual" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Line Items</h3>
            <button onClick={addItem} className="text-sm text-blue-600 hover:underline">+ Add Item</button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  {i === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>}
                  <select value={item.productId} onChange={(e) => updateItem(i, "productId", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>}
                  <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-3">
                  {i === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price</label>}
                  <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2 flex items-end gap-2">
                  <span className="text-sm text-gray-700 pb-2">{fmt(item.quantity * item.unitPrice)}</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 text-xs pb-2">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right text-sm font-semibold text-gray-900">Total: {fmt(total)}</div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Creating..." : "Create Purchase Order"}
        </button>
        <button onClick={() => router.back()} className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  );
}
