"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { dashboardApi } from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import { StatsCard } from "@/components/ui/StatsCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi.stats().then((res) => {
      if (res.success && res.data) {
        setStats(res.data as unknown as DashboardStats);
      } else {
        setError(res.message);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">
        Welcome back, <span className="font-medium text-gray-700">{user?.email}</span>
      </p>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Purchase Requests"
              value={stats.totalPurchaseRequests}
              subtitle={`${stats.pendingApprovals} pending approval`}
              color="bg-blue-50 text-blue-600"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <StatsCard
              title="Purchase Orders"
              value={stats.totalPurchaseOrders}
              color="bg-purple-50 text-purple-600"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
            />
            <StatsCard
              title="Unpaid Invoices"
              value={stats.unpaidInvoices}
              subtitle={`${stats.totalInvoices} total`}
              color="bg-orange-50 text-orange-600"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Low Stock Items"
              value={stats.lowStockItems}
              subtitle={`${stats.totalProducts} products`}
              color={stats.lowStockItems > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h2>
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-sm">
                      <StatusBadge status={act.action} />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700">
                          <span className="font-medium">{act.userName}</span>{" "}
                          {act.action.toLowerCase()}d{" "}
                          <span className="font-medium">{act.entityType}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No recent activity</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Total Vendors</span>
                  <span className="font-medium text-gray-900">{stats.totalVendors}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Total Products</span>
                  <span className="font-medium text-gray-900">{stats.totalProducts}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Stock Items</span>
                  <span className="font-medium text-gray-900">{stats.totalStockItems}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Pending Approvals</span>
                  <span className={`font-medium ${stats.pendingApprovals > 0 ? "text-orange-600" : "text-gray-900"}`}>
                    {stats.pendingApprovals}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
