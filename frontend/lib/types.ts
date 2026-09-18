export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  companyName: string;
  companyCode: string;
  userName: string;
  email: string;
  password: string;
}

export interface AuthUser {
  userId: string;
  companyId: string;
  role: string;
  email: string;
}

export interface PaginatedResponse<T> {
  total: number;
  data: T[];
}

// ─── Master Data ─────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  departmentId: string | null;
  departmentName: string | null;
  createdAt: string;
}

export interface Vendor {
  id: string;
  companyId: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  description: string;
  unit: string;
  minimumStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  code: string;
  location: string;
  isActive: boolean;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface Stock {
  id: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  quantity: number;
}

// ─── Procurement ─────────────────────────────────────────────────────────────

export interface PurchaseRequestItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  status: string;
  notes: string;
  totalAmount: number;
  departmentId: string;
  departmentName: string;
  requesterId: string;
  requesterName: string;
  items: PurchaseRequestItem[];
  approvalHistory?: ApprovalHistory[];
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  vendorId: string;
  vendorName: string;
  purchaseRequestId: string | null;
  purchaseRequestNumber: string | null;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export interface GoodsReceiptItem {
  id: string;
  productId: string;
  productName: string;
  quantityReceived: number;
  notes: string | null;
}

export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  receivedDate: string;
  status: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  warehouseId: string;
  warehouseName: string;
  items: GoodsReceiptItem[];
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
  status: string;
  vendorId: string;
  vendorName: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  createdAt: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface ApprovalHistory {
  id: string;
  approverId: string;
  approverName: string;
  action: string;
  comment: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalPurchaseRequests: number;
  pendingApprovals: number;
  totalPurchaseOrders: number;
  totalInvoices: number;
  unpaidInvoices: number;
  totalVendors: number;
  totalProducts: number;
  totalStockItems: number;
  lowStockItems: number;
  recentActivity: AuditLog[];
}
