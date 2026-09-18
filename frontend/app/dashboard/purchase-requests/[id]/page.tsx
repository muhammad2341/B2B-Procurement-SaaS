"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { purchaseRequestsApi } from "@/lib/api";
import { PurchaseRequest } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function PurchaseRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [pr, setPr] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | "cancel" | "submit" | null>(null);

  const load = () => {
    purchaseRequestsApi.get(id).then((res) => {
      if (res.success && res.data) setPr(res.data as unknown as PurchaseRequest);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  const doAction = async () => {
    if (!actionType) return;
    setActionLoading(true);
    let res;
    if (actionType === "submit") res = await purchaseRequestsApi.submit(id);
    else if (actionType === "approve") res = await purchaseRequestsApi.approve(id, comment);
    else if (actionType === "reject") res = await purchaseRequestsApi.reject(id, comment);
    else res = await purchaseRequestsApi.cancel(id);
    setActionLoading(false);
    setActionType(null);
    setComment("");
    if (res.success) load();
  };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);

  if (loading) return <LoadingSpinner />;
  if (!pr) return <p className="text-red-500">Purchase request not found.</p>;

  const canSubmit = pr.status === "Draft";
  const canCancel = ["Draft", "PendingApproval"].includes(pr.status);
  const canApproveReject = pr.status === "PendingApproval";

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; Back</button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pr.requestNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">{pr.departmentName} &middot; {pr.requesterName}</p>
        </div>
        <StatusBadge status={pr.status} />
      </div>

      {pr.notes && <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg p-3">{pr.notes}</p>}

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
            {pr.items.map((item) => (
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
              <td className="px-4 py-3 text-right text-gray-900">{fmt(pr.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {pr.approvalHistory && pr.approvalHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Approval History</h3>
          <div className="space-y-2">
            {pr.approvalHistory.map((h) => (
              <div key={h.id} className="flex items-start gap-3 text-sm">
                <StatusBadge status={h.action} />
                <div>
                  <p className="text-gray-700"><span className="font-medium">{h.approverName}</span>: {h.comment}</p>
                  <p className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {canSubmit && (
          <button onClick={() => setActionType("submit")} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            Submit for Approval
          </button>
        )}
        {canApproveReject && (
          <>
            <button onClick={() => setActionType("approve")} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
              Approve
            </button>
            <button onClick={() => setActionType("reject")} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
              Reject
            </button>
          </>
        )}
        {canCancel && (
          <button onClick={() => setActionType("cancel")} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300">
            Cancel
          </button>
        )}
      </div>

      <ConfirmDialog
        open={!!actionType}
        onClose={() => { setActionType(null); setComment(""); }}
        onConfirm={doAction}
        title={actionType === "submit" ? "Submit Request" : actionType === "approve" ? "Approve Request" : actionType === "reject" ? "Reject Request" : "Cancel Request"}
        confirmLabel={actionType === "submit" ? "Submit" : actionType === "approve" ? "Approve" : actionType === "reject" ? "Reject" : "Cancel"}
        loading={actionLoading}
        message={actionType === "cancel" ? "Are you sure you want to cancel this request?" : ""}
      >
        {(actionType === "approve" || actionType === "reject") && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add a comment..." />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
