namespace ProcureHub.Domain.Entities;
public class ApprovalHistory
{
    public Guid Id { get; set; }
    public Guid PurchaseRequestId { get; set; }
    public Guid ApproverId { get; set; }
    public string Action { get; set; } = string.Empty; // APPROVED or REJECTED
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public PurchaseRequest PurchaseRequest { get; set; } = null!;
    public User Approver { get; set; } = null!;
}
