"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { goodsReceiptsApi } from "@/lib/api";
import { GoodsReceipt } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function GoodsReceiptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [receipt, setReceipt] = useState<GoodsReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    goodsReceiptsApi.get(id).then((res) => {
      if (res.success && res.data) setReceipt(res.data as unknown as GoodsReceipt);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!receipt) return <p className="text-red-500">Goods receipt not found.</p>;

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">&larr; Back</button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{receipt.receiptNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">PO: {receipt.purchaseOrderNumber} &middot; Warehouse: {receipt.warehouseName}</p>
          <p className="text-xs text-gray-400 mt-1">Received: {new Date(receipt.receivedDate).toLocaleDateString("id-ID")}</p>
        </div>
        <StatusBadge status={receipt.status} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Qty Received</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {receipt.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-gray-900">{item.productName}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.quantityReceived}</td>
                <td className="px-4 py-3 text-gray-600">{item.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
