namespace ProcureHub.Domain.Entities;
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
