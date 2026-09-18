import os

domain_dir = r"d:\Portofolio\SaaS\backend\ProcureHub.Domain\Entities"
enums_dir = r"d:\Portofolio\SaaS\backend\ProcureHub.Domain\Enums"
config_dir = r"d:\Portofolio\SaaS\backend\ProcureHub.Infrastructure\Persistence\Configurations"

os.makedirs(domain_dir, exist_ok=True)
os.makedirs(enums_dir, exist_ok=True)
os.makedirs(config_dir, exist_ok=True)

enums = {
    "PurchaseRequestStatus": """namespace ProcureHub.Domain.Enums;
public enum PurchaseRequestStatus { Draft, PendingApproval, Approved, Rejected }
""",
    "PurchaseOrderStatus": """namespace ProcureHub.Domain.Enums;
public enum PurchaseOrderStatus { Draft, Issued, Confirmed, Completed, Canceled }
""",
    "GoodsReceiptStatus": """namespace ProcureHub.Domain.Enums;
public enum GoodsReceiptStatus { Draft, Completed }
""",
    "InvoiceStatus": """namespace ProcureHub.Domain.Enums;
public enum InvoiceStatus { Draft, Unpaid, Paid, Canceled }
"""
}

for name, content in enums.items():
    with open(os.path.join(enums_dir, f"{name}.cs"), "w", encoding="utf-8") as f:
        f.write(content)

entities = {
    "PurchaseRequest": """using ProcureHub.Domain.Enums;
namespace ProcureHub.Domain.Entities;
public class PurchaseRequest
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid DepartmentId { get; set; }
    public Guid RequesterId { get; set; }
    public string RequestNumber { get; set; } = string.Empty;
    public PurchaseRequestStatus Status { get; set; }
    public string Notes { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Company Company { get; set; } = null!;
    public Department Department { get; set; } = null!;
    public User Requester { get; set; } = null!;
    public ICollection<PurchaseRequestItem> Items { get; set; } = new List<PurchaseRequestItem>();
}
""",
    "PurchaseRequestItem": """namespace ProcureHub.Domain.Entities;
public class PurchaseRequestItem
{
    public Guid Id { get; set; }
    public Guid PurchaseRequestId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }

    public PurchaseRequest PurchaseRequest { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
""",
    "PurchaseOrder": """using ProcureHub.Domain.Enums;
namespace ProcureHub.Domain.Entities;
public class PurchaseOrder
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid PurchaseRequestId { get; set; }
    public Guid VendorId { get; set; }
    public string PONumber { get; set; } = string.Empty;
    public PurchaseOrderStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Company Company { get; set; } = null!;
    public PurchaseRequest PurchaseRequest { get; set; } = null!;
    public Vendor Vendor { get; set; } = null!;
    public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
}
""",
    "PurchaseOrderItem": """namespace ProcureHub.Domain.Entities;
public class PurchaseOrderItem
{
    public Guid Id { get; set; }
    public Guid PurchaseOrderId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }

    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
""",
    "GoodsReceipt": """using ProcureHub.Domain.Enums;
namespace ProcureHub.Domain.Entities;
public class GoodsReceipt
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid PurchaseOrderId { get; set; }
    public Guid WarehouseId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime ReceivedDate { get; set; }
    public GoodsReceiptStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Company Company { get; set; } = null!;
    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public Warehouse Warehouse { get; set; } = null!;
    public ICollection<GoodsReceiptItem> Items { get; set; } = new List<GoodsReceiptItem>();
}
""",
    "GoodsReceiptItem": """namespace ProcureHub.Domain.Entities;
public class GoodsReceiptItem
{
    public Guid Id { get; set; }
    public Guid GoodsReceiptId { get; set; }
    public Guid ProductId { get; set; }
    public int QuantityReceived { get; set; }
    public string Notes { get; set; } = string.Empty;

    public GoodsReceipt GoodsReceipt { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
""",
    "Invoice": """using ProcureHub.Domain.Enums;
namespace ProcureHub.Domain.Entities;
public class Invoice
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid PurchaseOrderId { get; set; }
    public Guid VendorId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Company Company { get; set; } = null!;
    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public Vendor Vendor { get; set; } = null!;
}
"""
}

for name, content in entities.items():
    with open(os.path.join(domain_dir, f"{name}.cs"), "w", encoding="utf-8") as f:
        f.write(content)

configs = {
    "PurchaseRequestConfiguration": """using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProcureHub.Domain.Entities;
namespace ProcureHub.Infrastructure.Persistence.Configurations;
public class PurchaseRequestConfiguration : IEntityTypeConfiguration<PurchaseRequest>
{
    public void Configure(EntityTypeBuilder<PurchaseRequest> builder)
    {
        builder.ToTable("purchase_requests");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.RequestNumber).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.HasIndex(x => new { x.CompanyId, x.RequestNumber }).IsUnique();
        builder.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Requester).WithMany().HasForeignKey(x => x.RequesterId).OnDelete(DeleteBehavior.Restrict);
    }
}
""",
    "PurchaseRequestItemConfiguration": """using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProcureHub.Domain.Entities;
namespace ProcureHub.Infrastructure.Persistence.Configurations;
public class PurchaseRequestItemConfiguration : IEntityTypeConfiguration<PurchaseRequestItem>
{
    public void Configure(EntityTypeBuilder<PurchaseRequestItem> builder)
    {
        builder.ToTable("purchase_request_items");
        builder.HasKey(x => x.Id);
        builder.HasOne(x => x.PurchaseRequest).WithMany(x => x.Items).HasForeignKey(x => x.PurchaseRequestId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
    }
}
""",
    "PurchaseOrderConfiguration": """using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProcureHub.Domain.Entities;
namespace ProcureHub.Infrastructure.Persistence.Configurations;
public class PurchaseOrderConfiguration : IEntityTypeConfiguration<PurchaseOrder>
{
    public void Configure(EntityTypeBuilder<PurchaseOrder> builder)
    {
        builder.ToTable("purchase_orders");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.PONumber).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.HasIndex(x => new { x.CompanyId, x.PONumber }).IsUnique();
        builder.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.PurchaseRequest).WithMany().HasForeignKey(x => x.PurchaseRequestId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Vendor).WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.Restrict);
    }
}
""",
    "PurchaseOrderItemConfiguration": """using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProcureHub.Domain.Entities;
namespace ProcureHub.Infrastructure.Persistence.Configurations;
public class PurchaseOrderItemConfiguration : IEntityTypeConfiguration<PurchaseOrderItem>
{
    public void Configure(EntityTypeBuilder<PurchaseOrderItem> builder)
    {
        builder.ToTable("purchase_order_items");
        builder.HasKey(x => x.Id);
        builder.HasOne(x => x.PurchaseOrder).WithMany(x => x.Items).HasForeignKey(x => x.PurchaseOrderId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
    }
}
""",
    "GoodsReceiptConfiguration": """using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProcureHub.Domain.Entities;
namespace ProcureHub.Infrastructure.Persistence.Configurations;
public class GoodsReceiptConfiguration : IEntityTypeConfiguration<GoodsReceipt>
{
    public void Configure(EntityTypeBuilder<GoodsReceipt> builder)
    {
        builder.ToTable("goods_receipts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ReceiptNumber).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.HasIndex(x => new { x.CompanyId, x.ReceiptNumber }).IsUnique();
        builder.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.PurchaseOrder).WithMany().HasForeignKey(x => x.PurchaseOrderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Warehouse).WithMany().HasForeignKey(x => x.WarehouseId).OnDelete(DeleteBehavior.Restrict);
    }
}
""",
    "GoodsReceiptItemConfiguration": """using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProcureHub.Domain.Entities;
namespace ProcureHub.Infrastructure.Persistence.Configurations;
public class GoodsReceiptItemConfiguration : IEntityTypeConfiguration<GoodsReceiptItem>
{
    public void Configure(EntityTypeBuilder<GoodsReceiptItem> builder)
    {
        builder.ToTable("goods_receipt_items");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Notes).HasMaxLength(500);
        builder.HasOne(x => x.GoodsReceipt).WithMany(x => x.Items).HasForeignKey(x => x.GoodsReceiptId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
    }
}
""",
    "InvoiceConfiguration": """using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProcureHub.Domain.Entities;
namespace ProcureHub.Infrastructure.Persistence.Configurations;
public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.ToTable("invoices");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.InvoiceNumber).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.HasIndex(x => new { x.CompanyId, x.InvoiceNumber }).IsUnique();
        builder.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.PurchaseOrder).WithMany().HasForeignKey(x => x.PurchaseOrderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Vendor).WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.Restrict);
    }
}
"""
}

for name, content in configs.items():
    with open(os.path.join(config_dir, f"{name}.cs"), "w", encoding="utf-8") as f:
        f.write(content)
