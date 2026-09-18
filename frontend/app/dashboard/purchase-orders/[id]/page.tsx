"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { purchaseOrdersApi } from "@/lib/api";
import { PurchaseOrder } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function PurchaseOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<"issue" | "cancel" | null>(null);

  const load = () => {
    purchaseOrdersApi.get(id).then((res) => {
      if (res.success && res.data) setPo(res.data as unknown as PurchaseOrder);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  const doAction = async () => {
    if (!actionType) return;
    setActionLoading(true);
    const res = actionType === "issue"
      ? await purchaseOrdersApi.issue(id)
      : await purchaseOrdersApi.cancel(id);
    setActionLoading(false);
    setActionType(null);
    if (res.success) load();
  };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);

  if (loading) return <LoadingSpinner />;
  if (!po) return <p className="text-red-500">Purchase order not found.</p>;

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; Back</button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{po.poNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">Vendor: {po.vendorName}</p>
          {po.purchaseRequestNumber && (
            <p className="text-xs text-gray-400 mt-1">From PR: {po.purchaseRequestNumber}</p>
          )}
        </div>
        <StatusBadge status={po.status} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Qty</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Unit Price</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {po.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-gray-900">{item.productName}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-600">{fmt(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold">
              <td colSpan={3} className="px-4 py-3 text-right text-gray-700">Total</td>
              <td className="px-4 py-3 text-right text-gray-900">{fmt(po.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex gap-3">
        {po.status === "Draft" && (
          <button onClick={() => setActionType("issue")} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            Issue PO
          </button>
        )}
        {["Draft", "Issued"].includes(po.status) && (
          <button onClick={() => setActionType("cancel")} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300">
            Cancel
          </button>
        )}
      </div>

      <ConfirmDialog
        open={!!actionType}
        onClose={() => setActionType(null)}
        onConfirm={doAction}
        title={actionType === "issue" ? "Issue Purchase Order" : "Cancel Purchase Order"}
        message={actionType === "issue" ? "Are you sure you want to issue this PO?" : "Are you sure you want to cancel this PO?"}
        confirmLabel={actionType === "issue" ? "Issue" : "Cancel PO"}
        loading={actionLoading}
      />
    </div>
  );
}
