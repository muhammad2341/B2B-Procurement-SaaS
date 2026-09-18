namespace ProcureHub.Domain.Entities;
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
