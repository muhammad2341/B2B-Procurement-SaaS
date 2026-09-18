"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { goodsReceiptsApi, purchaseOrdersApi, warehousesApi, productsApi } from "@/lib/api";
import { PurchaseOrder, Warehouse, Product } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface ReceiptItem {
  productId: string;
  quantityReceived: number;
  notes: string;
}

export default function NewGoodsReceiptPage() {
  const router = useRouter();
  const [issuedPOs, setIssuedPOs] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ purchaseOrderId: "", warehouseId: "" });
  const [items, setItems] = useState<ReceiptItem[]>([]);

  useEffect(() => {
    Promise.all([
      purchaseOrdersApi.list(),
      warehousesApi.list(),
    ]).then(([poRes, wRes]) => {
      if (poRes.success && poRes.data) {
        const all = poRes.data as unknown as PurchaseOrder[];
        setIssuedPOs(all.filter((po) => po.status === "Issued"));
      }
      if (wRes.success && wRes.data) setWarehouses(wRes.data as unknown as Warehouse[]);
      setLoading(false);
    });
  }, []);

  const handlePOChange = (poId: string) => {
    setForm({ ...form, purchaseOrderId: poId });
    const po = issuedPOs.find((p) => p.id === poId);
    if (po) {
      setItems(po.items.map((it) => ({ productId: it.productId, quantityReceived: it.quantity, notes: "" })));
    }
  };

  const updateItem = (i: number, field: keyof ReceiptItem, value: string | number) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [field]: value };
    setItems(copy);
  };

  const handleSubmit = async () => {
    if (!form.purchaseOrderId || !form.warehouseId) { setError("PO and warehouse are required"); return; }
    if (items.some((it) => it.quantityReceived <= 0)) { setError("All quantities must be > 0"); return; }
    setSaving(true); setError("");
    const res = await goodsReceiptsApi.create({
      purchaseOrderId: form.purchaseOrderId,
      warehouseId: form.warehouseId,
      items: items.map((it) => ({ productId: it.productId, quantityReceived: it.quantityReceived, notes: it.notes || undefined })),
    });
    setSaving(false);
    if (res.success && res.data) router.push(`/dashboard/goods-receipts/${(res.data as unknown as { id: string }).id}`);
    else setError(res.message);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; Back</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Receive Goods</h1>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order *</label>
            <select value={form.purchaseOrderId} onChange={(e) => handlePOChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select issued PO</option>
              {issuedPOs.map((po) => <option key={po.id} value={po.id}>{po.poNumber} - {po.vendorName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
            <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select warehouse</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Items to Receive</h3>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-4 text-sm text-gray-700 py-2">
                  Product ID: {item.productId.slice(0, 8)}...
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Qty Received</label>
                  <input type="number" min={0} value={item.quantityReceived} onChange={(e) => updateItem(i, "quantityReceived", Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <input value={item.notes} onChange={(e) => updateItem(i, "notes", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={saving || items.length === 0} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Receiving..." : "Receive Goods"}
        </button>
        <button onClick={() => router.back()} className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  );
}
