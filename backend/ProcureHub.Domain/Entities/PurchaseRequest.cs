using ProcureHub.Domain.Enums;
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
