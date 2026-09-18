namespace ProcureHub.Domain.Entities;

public class Department
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    
    public Company Company { get; set; } = null!;
}
