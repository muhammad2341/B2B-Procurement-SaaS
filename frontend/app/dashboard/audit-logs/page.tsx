"use client";

import { useEffect, useState } from "react";
import { auditLogsApi } from "@/lib/api";
import { AuditLog } from "@/lib/types";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

const ACTIONS = ["", "CREATE", "UPDATE", "DELETE", "LOGIN", "APPROVE", "REJECT", "SUBMIT", "CANCEL", "RECEIVE", "PAYMENT"];
const ENTITY_TYPES = ["", "Company", "User", "Department", "Vendor", "Product", "Warehouse", "PurchaseRequest", "PurchaseOrder", "GoodsReceipt", "Invoice"];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: "", entityType: "", from: "", to: "" });

  const load = (p = page) => {
    setLoading(true);
    auditLogsApi.list({
      page: p,
      pageSize: 20,
      action: filters.action || undefined,
      entityType: filters.entityType || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }).then((res) => {
      if (res.success && res.data) {
        const d = res.data as unknown as { total: number; data: AuditLog[] };
        setLogs(d.data);
        setTotal(d.total);
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(1); setPage(1); }, [filters]);

  const handlePageChange = (p: number) => { setPage(p); load(p); };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Logs</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACTIONS.map((a) => <option key={a} value={a}>{a || "All"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ENTITY_TYPES.map((e) => <option key={e} value={e}>{e || "All"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : logs.length === 0 ? <EmptyState title="No audit logs" message="No audit records found." /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Entity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-900">{log.userName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      ["APPROVE", "CREATE", "RECEIVE", "PAYMENT"].includes(log.action) ? "bg-green-100 text-green-700" :
                      ["DELETE", "REJECT", "CANCEL"].includes(log.action) ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{log.entityType}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                    {log.oldValues && (
                      <span className="text-red-500">old: {JSON.stringify(log.oldValues).slice(0, 50)}</span>
                    )}
                    {log.newValues && (
                      <span className="text-green-500 ml-1">new: {JSON.stringify(log.newValues).slice(0, 50)}</span>
                    )}
                    {!log.oldValues && !log.newValues && "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <Pagination page={page} total={total} pageSize={20} onPageChange={handlePageChange} />
          </div>
        </div>
      )}
    </div>
  );
}
