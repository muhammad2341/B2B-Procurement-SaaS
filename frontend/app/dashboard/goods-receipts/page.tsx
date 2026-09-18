"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { goodsReceiptsApi } from "@/lib/api";
import { GoodsReceipt } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    goodsReceiptsApi.list().then((res) => {
      if (res.success && res.data) setReceipts(res.data as unknown as GoodsReceipt[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Goods Receipts</h1>
        <Link href="/dashboard/goods-receipts/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          + Receive Goods
        </Link>
      </div>

      {receipts.length === 0 ? <EmptyState title="No goods receipts" message="No goods have been received yet." /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Receipt #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">PO Number</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Warehouse</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/goods-receipts/${r.id}`} className="text-blue-600 hover:underline font-medium">
                      {r.receiptNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.purchaseOrderNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{r.warehouseName}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{new Date(r.receivedDate).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
