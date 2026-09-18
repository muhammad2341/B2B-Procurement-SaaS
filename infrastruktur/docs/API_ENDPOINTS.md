# ProcureHub API Endpoints

Base URL: `http://localhost:5000`

Semua response dibungkus dalam format:
```json
{
  "success": true,
  "message": "OK",
  "data": { ... }
}
```

---

## 1. Authentication — `/api/Auth`

Tidak memerlukan autentikasi.

### POST `/api/Auth/register-company`
Registrasi company baru beserta user OWNER.

**Request Body:**
```json
{
  "companyName": "PT Maju Jaya",
  "companyCode": "MJ-001",
  "userName": "Budi Santoso",
  "email": "budi@majujaya.com",
  "password": "rahasia123"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Company registered successfully"
}
```

### POST `/api/Auth/login`
Login dan dapatkan JWT token.

**Request Body:**
```json
{
  "email": "budi@majujaya.com",
  "password": "rahasia123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "role": "OWNER",
    "userName": "Budi Santoso"
  }
}
```

---

## 2. Users — `/api/Users`

**Auth:** OWNER, ADMIN

### GET `/api/Users`
List semua user dalam company.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Budi Santoso",
    "email": "budi@majujaya.com",
    "role": "OWNER",
    "isActive": true,
    "departmentId": null,
    "departmentName": null,
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

### GET `/api/Users/{id}`
Detail user.

### POST `/api/Users`
Buat user baru.

**Request Body:**
```json
{
  "name": "Andi Lee",
  "email": "andi@majujaya.com",
  "password": "rahasia123",
  "role": "EMPLOYEE",
  "departmentId": "uuid"
}
```

### PUT `/api/Users/{id}/role`
Update role user.

**Request Body:**
```json
{
  "role": "MANAGER"
}
```

### POST `/api/Users/{id}/deactivate`
Nonaktifkan user.

### POST `/api/Users/{id}/activate`
Aktifkan kembali user.

---

## 3. Departments — `/api/Departments`

**Auth:** Semua user yang terautentikasi.

### GET `/api/Departments`
List semua department.

### GET `/api/Departments/{id}`
Detail department.

### POST `/api/Departments`
Buat department baru.

**Request Body:**
```json
{
  "name": "Purchasing",
  "code": "PUR"
}
```

### PUT `/api/Departments/{id}`
Update department.

**Request Body:**
```json
{
  "name": "Purchasing & Procurement",
  "code": "PUR"
}
```

### DELETE `/api/Departments/{id}`
Hapus department (gagal jika masih ada user yang menggunakan).

---

## 4. Vendors — `/api/Vendors`

**Auth:** Semua user yang terautentikasi.

### GET `/api/Vendors?search=&page=1&pageSize=10`
List vendor dengan pagination dan search.

**Query Parameters:**
- `search` (string, optional) — Filter by name/code
- `page` (int, default: 1)
- `pageSize` (int, default: 10)

**Response 200:**
```json
{
  "total": 50,
  "data": [
    {
      "id": "uuid",
      "name": "Supplier ABC",
      "code": "SUP-001",
      "email": "info@abc.com",
      "phone": "08123456789",
      "address": "Jl. Merdeka No. 1",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/api/Vendors/{id}`
Detail vendor.

### POST `/api/Vendors`
Buat vendor baru.

**Request Body:**
```json
{
  "name": "Supplier ABC",
  "code": "SUP-001",
  "email": "info@abc.com",
  "phone": "08123456789",
  "address": "Jl. Merdeka No. 1",
  "isActive": true
}
```

### PUT `/api/Vendors/{id}`
Update vendor.

### DELETE `/api/Vendors/{id}`
Hapus vendor.

---

## 5. Products — `/api/Products`

**Auth:** Semua user yang terautentikasi.

### GET `/api/Products?search=&page=1&pageSize=10`
List product dengan pagination dan search.

**Query Parameters:**
- `search` (string, optional) — Filter by name/SKU
- `page` (int, default: 1)
- `pageSize` (int, default: 10)

**Response 200:**
```json
{
  "total": 100,
  "data": [
    {
      "id": "uuid",
      "sku": "PRD-001",
      "name": "Kertas A4",
      "description": "Kertas HVS A4 70gsm",
      "unit": "Box",
      "minimumStock": 10,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/api/Products/{id}`
Detail product.

### POST `/api/Products`
Buat product baru.

**Request Body:**
```json
{
  "sku": "PRD-001",
  "name": "Kertas A4",
  "description": "Kertas HVS A4 70gsm",
  "unit": "Box",
  "minimumStock": 10,
  "isActive": true
}
```

### PUT `/api/Products/{id}`
Update product.

### DELETE `/api/Products/{id}`
Hapus product.

---

## 6. Warehouses — `/api/Warehouses`

**Auth:** Semua user yang terautentikasi.

### GET `/api/Warehouses`
List semua warehouse.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Gudang Utama",
    "code": "WH-001",
    "location": "Jakarta Selatan",
    "isActive": true
  }
]
```

### GET `/api/Warehouses/{id}`
Detail warehouse.

### POST `/api/Warehouses`
Buat warehouse baru.

**Request Body:**
```json
{
  "name": "Gudang Utama",
  "code": "WH-001",
  "location": "Jakarta Selatan",
  "isActive": true
}
```

### PUT `/api/Warehouses/{id}`
Update warehouse.

### DELETE `/api/Warehouses/{id}`
Hapus warehouse (gagal jika masih ada stock).

---

## 7. Stocks — `/api/Stocks`

**Auth:** Semua user yang terautentikasi.

### GET `/api/Stocks`
List semua stock di semua warehouse.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "warehouseId": "uuid",
    "warehouseName": "Gudang Utama",
    "productId": "uuid",
    "productName": "Kertas A4",
    "quantity": 100
  }
]
```

### GET `/api/Stocks/{warehouseId}`
Stock berdasarkan warehouse.

### GET `/api/Stocks/product/{productId}`
Stock berdasarkan product (di semua warehouse).

---

## 8. Purchase Requests — `/api/PurchaseRequests`

**Auth:** Semua user yang terautentikasi.
- Approve/Reject: MANAGER, ADMIN, OWNER

### GET `/api/PurchaseRequests`
List semua purchase request.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "requestNumber": "PR-20260918-0001",
    "status": "Draft",
    "notes": "Pembelian bulanan",
    "totalAmount": 500000,
    "departmentId": "uuid",
    "departmentName": "Purchasing",
    "requesterId": "uuid",
    "requesterName": "Budi Santoso",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "Kertas A4",
        "quantity": 10,
        "unitPrice": 50000,
        "totalPrice": 500000
      }
    ],
    "createdAt": "2026-09-18T00:00:00Z"
  }
]
```

### GET `/api/PurchaseRequests/{id}`
Detail purchase request dengan items, department, requester, dan approval history.

### POST `/api/PurchaseRequests`
Buat purchase request baru (status: Draft).

**Request Body:**
```json
{
  "departmentId": "uuid",
  "notes": "Pembelian bulanan September",
  "items": [
    {
      "productId": "uuid",
      "quantity": 10,
      "unitPrice": 50000
    }
  ]
}
```

### PUT `/api/PurchaseRequests/{id}`
Update purchase request (hanya jika status Draft).

### POST `/api/PurchaseRequests/{id}/submit`
Submit untuk approval (Draft → PendingApproval).

### POST `/api/PurchaseRequests/{id}/approve`
Approve purchase request (PendingApproval → Approved).

**Request Body:**
```json
"Looks good, approved"
```

### POST `/api/PurchaseRequests/{id}/reject`
Reject purchase request (PendingApproval → Rejected).

**Request Body:**
```json
"Budget exceeded, please revise"
```

### POST `/api/PurchaseRequests/{id}/cancel`
Cancel purchase request.

---

## 9. Purchase Orders — `/api/PurchaseOrders`

**Auth:** Semua user yang terautentikasi.

### GET `/api/PurchaseOrders`
List semua purchase order.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "poNumber": "PO-20260918-0001",
    "status": "Draft",
    "totalAmount": 500000,
    "vendorId": "uuid",
    "vendorName": "Supplier ABC",
    "purchaseRequestId": "uuid",
    "purchaseRequestNumber": "PR-20260918-0001",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "Kertas A4",
        "quantity": 10,
        "unitPrice": 50000,
        "totalPrice": 500000
      }
    ],
    "createdAt": "2026-09-18T00:00:00Z"
  }
]
```

### GET `/api/PurchaseOrders/{id}`
Detail purchase order dengan items.

### POST `/api/PurchaseOrders`
Buat purchase order baru secara manual.

**Request Body:**
```json
{
  "purchaseRequestId": "uuid",
  "vendorId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 10,
      "unitPrice": 50000
    }
  ]
}
```

### POST `/api/PurchaseOrders/from-request/{purchaseRequestId}`
Buat purchase order dari purchase request yang sudah approved.

**Request Body:**
```json
{
  "vendorId": "uuid"
}
```

### PUT `/api/PurchaseOrders/{id}`
Update purchase order (hanya jika status Draft).

### POST `/api/PurchaseOrders/{id}/issue`
Issue purchase order (Draft → Issued).

### POST `/api/PurchaseOrders/{id}/cancel`
Cancel purchase order.

---

## 10. Goods Receipts — `/api/GoodsReceipts`

**Auth:** Semua user yang terautentikasi.

### GET `/api/GoodsReceipts`
List semua goods receipt.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "receiptNumber": "GR-20260918-0001",
    "receivedDate": "2026-09-18T00:00:00Z",
    "status": "Completed",
    "purchaseOrderId": "uuid",
    "purchaseOrderNumber": "PO-20260918-0001",
    "warehouseId": "uuid",
    "warehouseName": "Gudang Utama",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "Kertas A4",
        "quantityReceived": 10,
        "notes": null
      }
    ],
    "createdAt": "2026-09-18T00:00:00Z"
  }
]
```

### GET `/api/GoodsReceipts/{id}`
Detail goods receipt dengan items.

### POST `/api/GoodsReceipts`
Terima goods (akan otomatis update stock).

**Request Body:**
```json
{
  "purchaseOrderId": "uuid",
  "warehouseId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantityReceived": 10,
      "notes": "Sesuai pesanan"
    }
  ]
}
```

---

## 11. Invoices — `/api/Invoices`

**Auth:** Semua user yang terautentikasi.

### GET `/api/Invoices`
List semua invoice.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "invoiceNumber": "INV-20260918-0001",
    "totalAmount": 500000,
    "dueDate": "2026-10-18T00:00:00Z",
    "status": "Unpaid",
    "vendorId": "uuid",
    "vendorName": "Supplier ABC",
    "purchaseOrderId": "uuid",
    "purchaseOrderNumber": "PO-20260918-0001",
    "createdAt": "2026-09-18T00:00:00Z"
  }
]
```

### GET `/api/Invoices/{id}`
Detail invoice.

### POST `/api/Invoices`
Buat invoice baru.

**Request Body:**
```json
{
  "invoiceNumber": "INV-20260918-0001",
  "vendorId": "uuid",
  "purchaseOrderId": "uuid",
  "totalAmount": 500000,
  "dueDate": "2026-10-18T00:00:00Z"
}
```

### PUT `/api/Invoices/{id}`
Update invoice (hanya jika status Unpaid).

**Request Body:**
```json
{
  "invoiceNumber": "INV-20260918-0001-REV",
  "totalAmount": 550000,
  "dueDate": "2026-10-25T00:00:00Z"
}
```

### POST `/api/Invoices/{id}/pay`
Tandai invoice sebagai dibayar (Unpaid → Paid).

### POST `/api/Invoices/{id}/cancel`
Cancel invoice.

### DELETE `/api/Invoices/{id}`
Hapus invoice (gagal jika status Paid).

---

## 12. Audit Logs — `/api/AuditLogs`

**Auth:** OWNER, ADMIN

### GET `/api/AuditLogs?action=&entityType=&userId=&from=&to=&page=1&pageSize=50`
List audit logs dengan filter.

**Query Parameters:**
- `action` (string, optional) — Filter: CREATE, UPDATE, DELETE, LOGIN, APPROVE, REJECT, SUBMIT, CANCEL, RECEIVE, PAYMENT
- `entityType` (string, optional) — Filter: Company, User, Department, Vendor, Product, Warehouse, PurchaseRequest, PurchaseOrder, GoodsReceipt, Invoice
- `userId` (string, optional) — Filter by user ID
- `from` (string, optional) — Start date (ISO 8601)
- `to` (string, optional) — End date (ISO 8601)
- `page` (int, default: 1)
- `pageSize` (int, default: 50)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 200,
    "data": [
      {
        "id": "uuid",
        "userId": "uuid",
        "userName": "Budi Santoso",
        "action": "APPROVE",
        "entityType": "PurchaseRequest",
        "entityId": "uuid",
        "oldValues": { "status": "PendingApproval" },
        "newValues": { "status": "Approved" },
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2026-09-18T00:00:00Z"
      }
    ]
  }
}
```
