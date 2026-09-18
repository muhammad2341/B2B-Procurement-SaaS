using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcureHub.Application.Common;
using ProcureHub.Domain.Entities;
using ProcureHub.Domain.Enums;
using ProcureHub.Domain.Constants;
using ProcureHub.Infrastructure.Persistence;
using System.Text.Json;

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
    public async Task<IActionResult> Create([FromBody] CreatePurchaseRequestDto dto)
    {
        var requestNumber = await GenerateRequestNumber();

        var pr = new PurchaseRequest
        {
            Id = Guid.NewGuid(),
            CompanyId = _currentUser.CompanyId,
            RequesterId = _currentUser.UserId,
            DepartmentId = dto.DepartmentId,
            RequestNumber = requestNumber,
            Notes = dto.Notes,
            Status = PurchaseRequestStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (dto.Items != null && dto.Items.Count > 0)
        {
            foreach (var item in dto.Items)
            {
                pr.Items.Add(new PurchaseRequestItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.Quantity * item.UnitPrice
                });
            }
            pr.TotalAmount = pr.Items.Sum(i => i.TotalPrice);
        }

        _context.PurchaseRequests.Add(pr);

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(), CompanyId = _currentUser.CompanyId, UserId = _currentUser.UserId,
            Action = "CREATE", EntityType = "PurchaseRequest", EntityId = pr.Id,
            OldValues = "", NewValues = JsonSerializer.Serialize(pr),
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
            UserAgent = Request.Headers["User-Agent"].ToString(),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(pr);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _context.PurchaseRequests
            .Include(pr => pr.Department)
            .Include(pr => pr.Items)
            .Where(pr => pr.CompanyId == _currentUser.CompanyId)
            .OrderByDescending(pr => pr.CreatedAt)
            .ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var pr = await _context.PurchaseRequests
            .Include(x => x.Department)
            .Include(x => x.Items).ThenInclude(i => i.Product)
            .Include(x => x.Requester)
            .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        return pr != null ? Ok(pr) : NotFound();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePurchaseRequestDto update)
    {
        var pr = await _context.PurchaseRequests
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (pr == null) return NotFound();
        if (pr.Status != PurchaseRequestStatus.Draft) return BadRequest("Only DRAFT requests can be edited.");

        var oldValues = JsonSerializer.Serialize(pr);

        pr.Notes = update.Notes ?? pr.Notes;
        pr.DepartmentId = update.DepartmentId != Guid.Empty ? update.DepartmentId : pr.DepartmentId;

        if (update.Items != null)
        {
            var existingItems = pr.Items.ToList();
            _context.PurchaseRequestItems.RemoveRange(existingItems);
            pr.Items.Clear();

            foreach (var item in update.Items)
            {
                pr.Items.Add(new PurchaseRequestItem
                {
                    Id = Guid.NewGuid(),
                    PurchaseRequestId = pr.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.Quantity * item.UnitPrice
                });
            }
            pr.TotalAmount = pr.Items.Sum(i => i.TotalPrice);
        }

        pr.UpdatedAt = DateTime.UtcNow;

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(), CompanyId = _currentUser.CompanyId, UserId = _currentUser.UserId,
            Action = "UPDATE", EntityType = "PurchaseRequest", EntityId = pr.Id,
            OldValues = oldValues, NewValues = JsonSerializer.Serialize(pr),
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
            UserAgent = Request.Headers["User-Agent"].ToString(),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(pr);
    }

    [HttpPost("{id}/submit")]
    public async Task<IActionResult> Submit(Guid id)
    {
        var pr = await _context.PurchaseRequests.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (pr == null) return NotFound();
        if (pr.Status != PurchaseRequestStatus.Draft) return BadRequest("Only DRAFT requests can be submitted.");

        pr.Status = PurchaseRequestStatus.PendingApproval;
        pr.UpdatedAt = DateTime.UtcNow;

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(), CompanyId = _currentUser.CompanyId, UserId = _currentUser.UserId,
            Action = "SUBMIT", EntityType = "PurchaseRequest", EntityId = pr.Id,
            OldValues = "", NewValues = JsonSerializer.Serialize(pr),
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
            UserAgent = Request.Headers["User-Agent"].ToString(),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(pr);
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var pr = await _context.PurchaseRequests.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (pr == null) return NotFound();

        pr.Status = PurchaseRequestStatus.Canceled;
        pr.UpdatedAt = DateTime.UtcNow;

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(), CompanyId = _currentUser.CompanyId, UserId = _currentUser.UserId,
            Action = "CANCEL", EntityType = "PurchaseRequest", EntityId = pr.Id,
            OldValues = "", NewValues = JsonSerializer.Serialize(pr),
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
            UserAgent = Request.Headers["User-Agent"].ToString(),
            CreatedAt = DateTime.UtcNow
        });

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

        _context.Set<ApprovalHistory>().Add(new ApprovalHistory
        {
            Id = Guid.NewGuid(), PurchaseRequestId = pr.Id, ApproverId = _currentUser.UserId,
            Action = "APPROVED", Comment = comment, CreatedAt = DateTime.UtcNow
        });

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(), CompanyId = _currentUser.CompanyId, UserId = _currentUser.UserId,
            Action = "APPROVE", EntityType = "PurchaseRequest", EntityId = pr.Id,
            OldValues = "", NewValues = JsonSerializer.Serialize(pr),
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
            UserAgent = Request.Headers["User-Agent"].ToString(),
            CreatedAt = DateTime.UtcNow
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

        _context.Set<ApprovalHistory>().Add(new ApprovalHistory
        {
            Id = Guid.NewGuid(), PurchaseRequestId = pr.Id, ApproverId = _currentUser.UserId,
            Action = "REJECTED", Comment = comment, CreatedAt = DateTime.UtcNow
        });

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(), CompanyId = _currentUser.CompanyId, UserId = _currentUser.UserId,
            Action = "REJECT", EntityType = "PurchaseRequest", EntityId = pr.Id,
            OldValues = "", NewValues = JsonSerializer.Serialize(pr),
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
            UserAgent = Request.Headers["User-Agent"].ToString(),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(pr);
    }

    private async Task<string> GenerateRequestNumber()
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"PR-{today}-";
        var lastNumber = await _context.PurchaseRequests
            .Where(pr => pr.CompanyId == _currentUser.CompanyId && pr.RequestNumber.StartsWith(prefix))
            .CountAsync();
        return $"{prefix}{(lastNumber + 1):D4}";
    }
}

public class CreatePurchaseRequestDto
{
    public Guid DepartmentId { get; set; }
    public string Notes { get; set; } = "";
    public List<CreatePurchaseRequestItemDto>? Items { get; set; }
}

public class UpdatePurchaseRequestDto
{
    public Guid DepartmentId { get; set; }
    public string Notes { get; set; } = "";
    public List<CreatePurchaseRequestItemDto>? Items { get; set; }
}

public class CreatePurchaseRequestItemDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
