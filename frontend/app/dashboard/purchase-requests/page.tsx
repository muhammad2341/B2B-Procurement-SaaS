"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { purchaseRequestsApi } from "@/lib/api";
import { PurchaseRequest } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function PurchaseRequestsPage() {
  const [prs, setPrs] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    purchaseRequestsApi.list().then((res) => {
      if (res.success && res.data) setPrs(res.data as unknown as PurchaseRequest[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Requests</h1>
        <Link href="/dashboard/purchase-requests/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          + New Request
        </Link>
      </div>

      {prs.length === 0 ? <EmptyState title="No purchase requests" message="Create your first purchase request." /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Request #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Requester</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prs.map((pr) => (
                <tr key={pr.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/purchase-requests/${pr.id}`} className="text-blue-600 hover:underline font-medium">
                      {pr.requestNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{pr.departmentName}</td>
                  <td className="px-4 py-3 text-gray-600">{pr.requesterName}</td>
                  <td className="px-4 py-3"><StatusBadge status={pr.status} /></td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(pr.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{new Date(pr.createdAt).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
