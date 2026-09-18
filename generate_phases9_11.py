import os

domain_dir = r"d:\Portofolio\SaaS\backend\ProcureHub.Domain\Entities"
config_dir = r"d:\Portofolio\SaaS\backend\ProcureHub.Infrastructure\Persistence\Configurations"
api_dir = r"d:\Portofolio\SaaS\backend\ProcureHub.Api\Controllers"

os.makedirs(domain_dir, exist_ok=True)
os.makedirs(config_dir, exist_ok=True)
os.makedirs(api_dir, exist_ok=True)

files = {
    os.path.join(domain_dir, "ApprovalHistory.cs"): """namespace ProcureHub.Domain.Entities;
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
""",
    os.path.join(config_dir, "ApprovalHistoryConfiguration.cs"): """using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProcureHub.Domain.Entities;
namespace ProcureHub.Infrastructure.Persistence.Configurations;
public class ApprovalHistoryConfiguration : IEntityTypeConfiguration<ApprovalHistory>
{
    public void Configure(EntityTypeBuilder<ApprovalHistory> builder)
    {
        builder.ToTable("approval_histories");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Action).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Comment).HasMaxLength(1000);
        builder.HasOne(x => x.PurchaseRequest).WithMany().HasForeignKey(x => x.PurchaseRequestId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Approver).WithMany().HasForeignKey(x => x.ApproverId).OnDelete(DeleteBehavior.Restrict);
    }
}
""",
    os.path.join(api_dir, "WarehousesController.cs"): """using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcureHub.Application.Common;
using ProcureHub.Domain.Entities;
using ProcureHub.Infrastructure.Persistence;

namespace ProcureHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WarehousesController : ControllerBase
{
    private readonly ProcureHubDbContext _context;
    private readonly ICurrentUserService _currentUser;
    public WarehousesController(ProcureHubDbContext context, ICurrentUserService currentUser) { _context = context; _currentUser = currentUser; }

    [HttpGet]
    public async Task<IActionResult> GetWarehouses()
    {
        var warehouses = await _context.Warehouses.Where(w => w.CompanyId == _currentUser.CompanyId).ToListAsync();
        return Ok(warehouses);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetWarehouse(Guid id)
    {
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == id && w.CompanyId == _currentUser.CompanyId);
        if (warehouse == null) return NotFound();
        return Ok(warehouse);
    }

    [HttpPost]
    public async Task<IActionResult> CreateWarehouse([FromBody] Warehouse w)
    {
        w.Id = Guid.NewGuid();
        w.CompanyId = _currentUser.CompanyId;
        w.CreatedAt = DateTime.UtcNow;
        w.UpdatedAt = DateTime.UtcNow;
        _context.Warehouses.Add(w);
        await _context.SaveChangesAsync();
        return Ok(w);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWarehouse(Guid id, [FromBody] Warehouse request)
    {
        var w = await _context.Warehouses.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (w == null) return NotFound();
        w.Name = request.Name;
        w.Code = request.Code;
        w.Location = request.Location;
        w.IsActive = request.IsActive;
        w.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(w);
    }
}
""",
    os.path.join(api_dir, "StocksController.cs"): """using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcureHub.Application.Common;
using ProcureHub.Infrastructure.Persistence;

namespace ProcureHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StocksController : ControllerBase
{
    private readonly ProcureHubDbContext _context;
    private readonly ICurrentUserService _currentUser;
    public StocksController(ProcureHubDbContext context, ICurrentUserService currentUser) { _context = context; _currentUser = currentUser; }

    [HttpGet]
    public async Task<IActionResult> GetStocks()
    {
        var stocks = await _context.Stocks
            .Include(s => s.Product)
            .Include(s => s.Warehouse)
            .Where(s => s.CompanyId == _currentUser.CompanyId).ToListAsync();
        return Ok(stocks);
    }

    [HttpGet("{warehouseId}")]
    public async Task<IActionResult> GetStocksByWarehouse(Guid warehouseId)
    {
        var warehouseExists = await _context.Warehouses.AnyAsync(w => w.Id == warehouseId && w.CompanyId == _currentUser.CompanyId);
        if (!warehouseExists) return NotFound("Warehouse not found.");

        var stocks = await _context.Stocks
            .Include(s => s.Product)
            .Where(s => s.CompanyId == _currentUser.CompanyId && s.WarehouseId == warehouseId).ToListAsync();
        return Ok(stocks);
    }
}
""",
    os.path.join(api_dir, "PurchaseRequestsController.cs"): """using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcureHub.Application.Common;
using ProcureHub.Domain.Entities;
using ProcureHub.Domain.Enums;
using ProcureHub.Domain.Constants;
using ProcureHub.Infrastructure.Persistence;

namespace ProcureHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchaseRequestsController : ControllerBase
{
    private readonly ProcureHubDbContext _context;
    private readonly ICurrentUserService _currentUser;
    public PurchaseRequestsController(ProcureHubDbContext context, ICurrentUserService currentUser) { _context = context; _currentUser = currentUser; }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PurchaseRequest request)
    {
        request.Id = Guid.NewGuid();
        request.CompanyId = _currentUser.CompanyId;
        request.RequesterId = _currentUser.UserId;
        request.Status = PurchaseRequestStatus.Draft;
        request.CreatedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;
        _context.PurchaseRequests.Add(request);
        await _context.SaveChangesAsync();
        return Ok(request);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _context.PurchaseRequests.Where(pr => pr.CompanyId == _currentUser.CompanyId).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var pr = await _context.PurchaseRequests.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        return pr != null ? Ok(pr) : NotFound();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PurchaseRequest update)
    {
        var pr = await _context.PurchaseRequests.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (pr == null) return NotFound();
        if (pr.Status != PurchaseRequestStatus.Draft) return BadRequest("Only DRAFT requests can be edited.");
        
        pr.Notes = update.Notes;
        pr.TotalAmount = update.TotalAmount;
        pr.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(pr);
    }

    [HttpPost("{id}/submit")]
    public async Task<IActionResult> Submit(Guid id)
    {
        var pr = await _context.PurchaseRequests.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (pr == null) return NotFound();
        if (pr.Status != PurchaseRequestStatus.Draft) return BadRequest("Only DRAFT requests can be submitted.");
        
        pr.Status = PurchaseRequestStatus.PendingApproval; // Maps to SUBMITTED
        pr.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(pr);
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var pr = await _context.PurchaseRequests.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (pr == null) return NotFound();
        
        pr.Status = (PurchaseRequestStatus)4; // Casting 4 as Canceled assuming enum extension
        pr.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(pr);
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = Roles.Manager + "," + Roles.Admin + "," + Roles.Owner)]
    public async Task<IActionResult> Approve(Guid id, [FromBody] string comment)
    {
        var pr = await _context.PurchaseRequests.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (pr == null) return NotFound();
        if (pr.Status != PurchaseRequestStatus.PendingApproval) return BadRequest("Request must be submitted to be approved.");

        pr.Status = PurchaseRequestStatus.Approved;
        pr.UpdatedAt = DateTime.UtcNow;

        _context.Set<ApprovalHistory>().Add(new ApprovalHistory {
            Id = Guid.NewGuid(), PurchaseRequestId = pr.Id, ApproverId = _currentUser.UserId,
            Action = "APPROVED", Comment = comment, CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(pr);
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = Roles.Manager + "," + Roles.Admin + "," + Roles.Owner)]
    public async Task<IActionResult> Reject(Guid id, [FromBody] string comment)
    {
        var pr = await _context.PurchaseRequests.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (pr == null) return NotFound();
        if (pr.Status != PurchaseRequestStatus.PendingApproval) return BadRequest("Request must be submitted to be rejected.");

        pr.Status = PurchaseRequestStatus.Rejected;
        pr.UpdatedAt = DateTime.UtcNow;

        _context.Set<ApprovalHistory>().Add(new ApprovalHistory {
            Id = Guid.NewGuid(), PurchaseRequestId = pr.Id, ApproverId = _currentUser.UserId,
            Action = "REJECTED", Comment = comment, CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(pr);
    }
}
"""
}

for path, content in files.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
