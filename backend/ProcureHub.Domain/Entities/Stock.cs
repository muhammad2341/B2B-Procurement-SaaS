namespace ProcureHub.Domain.Entities;

public class Stock
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Company Company { get; set; } = null!;
    public Warehouse Warehouse { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
