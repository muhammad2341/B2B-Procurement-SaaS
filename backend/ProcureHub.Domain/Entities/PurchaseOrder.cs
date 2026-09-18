using ProcureHub.Domain.Enums;
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
