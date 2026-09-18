using ProcureHub.Domain.Enums;
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
