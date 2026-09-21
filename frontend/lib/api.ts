import {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  PaginatedResponse,
  Department,
  User,
  Vendor,
  Product,
  Warehouse,
  Stock,
  PurchaseRequest,
  PurchaseOrder,
  GoodsReceipt,
  Invoice,
  AuditLog,
  DashboardStats,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      success: false,
      message: body?.message ?? `HTTP error ${res.status}`,
      errors: body?.errors,
    };
  }

  // Backend returns { success, message, data } – use it directly when present,
  // otherwise wrap raw body for endpoints that return plain arrays/objects.
  if (body && typeof body === "object" && "success" in body) {
    return {
      success: body.success,
      message: body.message ?? "OK",
      data: body.data as T,
      errors: body.errors,
    };
  }

  return { success: true, message: "OK", data: body as T };
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) =>
    request<{ token: string }>("/api/Auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  registerCompany: (data: RegisterRequest) =>
    request<{ message: string }>("/api/Auth/register-company", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Departments ────────────────────────────────────────────────────────────
export const departmentsApi = {
  list: () => request<Department[]>("/api/Departments"),
  get: (id: string) => request<Department>(`/api/Departments/${id}`),
  create: (data: { name: string; code: string }) =>
    request<Department>("/api/Departments", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name: string; code: string }) =>
    request<Department>(`/api/Departments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/api/Departments/${id}`, { method: "DELETE" }),
};

// ─── Users ──────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => request<User[]>("/api/Users"),
  get: (id: string) => request<User>(`/api/Users/${id}`),
  create: (data: { name: string; email: string; password: string; role?: string; departmentId?: string }) =>
    request<User>("/api/Users", { method: "POST", body: JSON.stringify(data) }),
  updateRole: (id: string, role: string) =>
    request<User>(`/api/Users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  deactivate: (id: string) =>
    request<User>(`/api/Users/${id}/deactivate`, { method: "POST" }),
  activate: (id: string) =>
    request<User>(`/api/Users/${id}/activate`, { method: "POST" }),
};

// ─── Vendors ────────────────────────────────────────────────────────────────
export const vendorsApi = {
  list: (params?: { search?: string; page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    const qs = sp.toString();
    return request<PaginatedResponse<Vendor>>(`/api/Vendors${qs ? "?" + qs : ""}`);
  },
  get: (id: string) => request<Vendor>(`/api/Vendors/${id}`),
  create: (data: Omit<Vendor, "id" | "companyId" | "createdAt" | "updatedAt">) =>
    request<Vendor>("/api/Vendors", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Omit<Vendor, "id" | "companyId" | "createdAt" | "updatedAt">) =>
    request<Vendor>(`/api/Vendors/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/api/Vendors/${id}`, { method: "DELETE" }),
};

// ─── Products ───────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: { search?: string; page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    const qs = sp.toString();
    return request<PaginatedResponse<Product>>(`/api/Products${qs ? "?" + qs : ""}`);
  },
  get: (id: string) => request<Product>(`/api/Products/${id}`),
  create: (data: Omit<Product, "id" | "companyId" | "createdAt" | "updatedAt">) =>
    request<Product>("/api/Products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Omit<Product, "id" | "companyId" | "createdAt" | "updatedAt">) =>
    request<Product>(`/api/Products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/api/Products/${id}`, { method: "DELETE" }),
};

// ─── Warehouses ─────────────────────────────────────────────────────────────
export const warehousesApi = {
  list: () => request<Warehouse[]>("/api/Warehouses"),
  get: (id: string) => request<Warehouse>(`/api/Warehouses/${id}`),
  create: (data: Omit<Warehouse, "id" | "companyId">) =>
    request<Warehouse>("/api/Warehouses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Omit<Warehouse, "id" | "companyId">) =>
    request<Warehouse>(`/api/Warehouses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/api/Warehouses/${id}`, { method: "DELETE" }),
};

// ─── Stocks ─────────────────────────────────────────────────────────────────
export const stocksApi = {
  list: () => request<Stock[]>("/api/Stocks"),
  byWarehouse: (warehouseId: string) => request<Stock[]>(`/api/Stocks/${warehouseId}`),
  byProduct: (productId: string) => request<Stock[]>(`/api/Stocks/product/${productId}`),
};

// ─── Purchase Requests ──────────────────────────────────────────────────────
export const purchaseRequestsApi = {
  list: () => request<PurchaseRequest[]>("/api/PurchaseRequests"),
  get: (id: string) => request<PurchaseRequest>(`/api/PurchaseRequests/${id}`),
  create: (data: { departmentId: string; notes: string; items?: { productId: string; quantity: number; unitPrice: number }[] }) =>
    request<PurchaseRequest>("/api/PurchaseRequests", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { departmentId: string; notes: string; items?: { productId: string; quantity: number; unitPrice: number }[] }) =>
    request<PurchaseRequest>(`/api/PurchaseRequests/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  submit: (id: string) =>
    request<PurchaseRequest>(`/api/PurchaseRequests/${id}/submit`, { method: "POST" }),
  approve: (id: string, comment: string) =>
    request<PurchaseRequest>(`/api/PurchaseRequests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(comment),
    }),
  reject: (id: string, comment: string) =>
    request<PurchaseRequest>(`/api/PurchaseRequests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(comment),
    }),
  cancel: (id: string) =>
    request<PurchaseRequest>(`/api/PurchaseRequests/${id}/cancel`, { method: "POST" }),
};

// ─── Purchase Orders ────────────────────────────────────────────────────────
export const purchaseOrdersApi = {
  list: () => request<PurchaseOrder[]>("/api/PurchaseOrders"),
  get: (id: string) => request<PurchaseOrder>(`/api/PurchaseOrders/${id}`),
  create: (data: { purchaseRequestId?: string; vendorId: string; items?: { productId: string; quantity: number; unitPrice: number }[] }) =>
    request<PurchaseOrder>("/api/PurchaseOrders", { method: "POST", body: JSON.stringify(data) }),
  createFromRequest: (prId: string, vendorId: string) =>
    request<PurchaseOrder>(`/api/PurchaseOrders/from-request/${prId}`, {
      method: "POST",
      body: JSON.stringify({ vendorId }),
    }),
  update: (id: string, data: { vendorId: string; items?: { productId: string; quantity: number; unitPrice: number }[] }) =>
    request<PurchaseOrder>(`/api/PurchaseOrders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  issue: (id: string) =>
    request<PurchaseOrder>(`/api/PurchaseOrders/${id}/issue`, { method: "POST" }),
  cancel: (id: string) =>
    request<PurchaseOrder>(`/api/PurchaseOrders/${id}/cancel`, { method: "POST" }),
};

// ─── Goods Receipts ─────────────────────────────────────────────────────────
export const goodsReceiptsApi = {
  list: () => request<GoodsReceipt[]>("/api/GoodsReceipts"),
  get: (id: string) => request<GoodsReceipt>(`/api/GoodsReceipts/${id}`),
  create: (data: { purchaseOrderId: string; warehouseId: string; items: { productId: string; quantityReceived: number; notes?: string }[] }) =>
    request<GoodsReceipt>("/api/GoodsReceipts", { method: "POST", body: JSON.stringify(data) }),
};

// ─── Invoices ───────────────────────────────────────────────────────────────
export const invoicesApi = {
  list: () => request<Invoice[]>("/api/Invoices"),
  get: (id: string) => request<Invoice>(`/api/Invoices/${id}`),
  create: (data: { invoiceNumber: string; vendorId: string; purchaseOrderId: string; totalAmount: number; dueDate: string }) =>
    request<Invoice>("/api/Invoices", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { invoiceNumber: string; totalAmount: number; dueDate: string }) =>
    request<Invoice>(`/api/Invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  pay: (id: string) =>
    request<Invoice>(`/api/Invoices/${id}/pay`, { method: "POST" }),
  cancel: (id: string) =>
    request<Invoice>(`/api/Invoices/${id}/cancel`, { method: "POST" }),
  delete: (id: string) =>
    request<void>(`/api/Invoices/${id}`, { method: "DELETE" }),
};

// ─── Audit Logs ─────────────────────────────────────────────────────────────
export const auditLogsApi = {
  list: (params?: { action?: string; entityType?: string; userId?: string; from?: string; to?: string; page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.action) sp.set("action", params.action);
    if (params?.entityType) sp.set("entityType", params.entityType);
    if (params?.userId) sp.set("userId", params.userId);
    if (params?.from) sp.set("from", params.from);
    if (params?.to) sp.set("to", params.to);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    const qs = sp.toString();
    return request<PaginatedResponse<AuditLog>>(`/api/AuditLogs${qs ? "?" + qs : ""}`);
  },
};

// ─── Dashboard ──────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => request<DashboardStats>("/api/Dashboard/stats"),
};
