"use client";

import { useEffect, useState } from "react";
import { stocksApi, warehousesApi } from "@/lib/api";
import { Stock, Warehouse } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([stocksApi.list(), warehousesApi.list()]).then(([sRes, wRes]) => {
      if (sRes.success && sRes.data) setStocks(sRes.data as unknown as Stock[]);
      if (wRes.success && wRes.data) setWarehouses(wRes.data as unknown as Warehouse[]);
      setLoading(false);
    });
  }, []);

  const filteredStocks = selectedWarehouse === "all"
    ? stocks
    : stocks.filter((s) => s.warehouseId === selectedWarehouse);


  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventory / Stocks</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Warehouse</label>
        <select
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
          className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {filteredStocks.length === 0 ? (
        <EmptyState title="No stock data" message="No inventory records found." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Warehouse</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Quantity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStocks.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">{s.productName}</td>
                  <td className="px-4 py-3 text-gray-600">{s.warehouseName}</td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">{s.quantity}</td>
                  <td className="px-4 py-3">
                    {s.quantity === 0 ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold">Out of Stock</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">In Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
