"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { invoicesApi } from "@/lib/api";
import { Invoice } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<"pay" | "cancel" | "delete" | null>(null);

  const load = useCallback(() => {
    invoicesApi.get(id).then((res) => {
      if (res.success && res.data) setInvoice(res.data as unknown as Invoice);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const doAction = async () => {
    if (!actionType) return;
    setActionLoading(true);
    let res;
    if (actionType === "pay") res = await invoicesApi.pay(id);
    else if (actionType === "cancel") res = await invoicesApi.cancel(id);
    else res = await invoicesApi.delete(id);
    setActionLoading(false);
    setActionType(null);
    if (res.success) {
      if (actionType === "delete") router.push("/dashboard/invoices");
      else load();
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);

  if (loading) return <LoadingSpinner />;
  if (!invoice) return <p className="text-red-500">Invoice not found.</p>;

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; Back</button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">Vendor: {invoice.vendorName}</p>
          <p className="text-xs text-gray-400 mt-1">PO: {invoice.purchaseOrderNumber}</p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500">Amount</p>
            <p className="text-lg font-bold text-gray-900">{fmt(invoice.totalAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Due Date</p>
            <p className="text-sm font-medium text-gray-900">{new Date(invoice.dueDate).toLocaleDateString("id-ID")}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <StatusBadge status={invoice.status} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-sm text-gray-600">{new Date(invoice.createdAt).toLocaleDateString("id-ID")}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {invoice.status === "Unpaid" && (
          <button onClick={() => setActionType("pay")} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
            Mark as Paid
          </button>
        )}
        {invoice.status !== "Paid" && (
          <button onClick={() => setActionType("cancel")} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300">
            Cancel
          </button>
        )}
        {invoice.status !== "Paid" && (
          <button onClick={() => setActionType("delete")} className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200">
            Delete
          </button>
        )}
      </div>

      <ConfirmDialog
        open={!!actionType}
        onClose={() => setActionType(null)}
        onConfirm={doAction}
        title={actionType === "pay" ? "Mark as Paid" : actionType === "cancel" ? "Cancel Invoice" : "Delete Invoice"}
        message={actionType === "pay" ? "Mark this invoice as paid?" : actionType === "cancel" ? "Cancel this invoice?" : "Permanently delete this invoice?"}
        confirmLabel={actionType === "pay" ? "Pay" : actionType === "cancel" ? "Cancel" : "Delete"}
        loading={actionLoading}
      />
    </div>
  );
}
