using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcureHub.Application.Common;
using ProcureHub.Domain.Entities;
using ProcureHub.Infrastructure.Persistence;
using System.Text.Json;

namespace ProcureHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VendorsController : ControllerBase
{
    private readonly ProcureHubDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public VendorsController(ProcureHubDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetVendors([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.Vendors.Where(v => v.CompanyId == _currentUser.CompanyId);
        
        if (!string.IsNullOrEmpty(search))
            query = query.Where(v => v.Name.Contains(search) || v.Code.Contains(search));

        var total = await query.CountAsync();
        var vendors = await query.OrderByDescending(v => v.CreatedAt)
                                 .Skip((page - 1) * pageSize)
                                 .Take(pageSize)
                                 .ToListAsync();
                                 
        return Ok(new { Total = total, Data = vendors });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetVendor(Guid id)
    {
        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.Id == id && v.CompanyId == _currentUser.CompanyId);
        if (vendor == null) return NotFound();
        return Ok(vendor);
    }

    [HttpPost]
    public async Task<IActionResult> CreateVendor([FromBody] VendorRequest request)
    {
        var vendor = new Vendor
        {
            Id = Guid.NewGuid(),
            CompanyId = _currentUser.CompanyId,
            Name = request.Name,
            Code = request.Code,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        _context.Vendors.Add(vendor);
        await LogAudit("CREATE", "Vendor", vendor.Id, null, vendor);
        await _context.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetVendor), new { id = vendor.Id }, vendor);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVendor(Guid id, [FromBody] VendorRequest request)
    {
        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.Id == id && v.CompanyId == _currentUser.CompanyId);
        if (vendor == null) return NotFound();

        var oldValues = JsonSerializer.Serialize(vendor);

        vendor.Name = request.Name;
        vendor.Code = request.Code;
        vendor.Email = request.Email;
        vendor.Phone = request.Phone;
        vendor.Address = request.Address;
        vendor.IsActive = request.IsActive;
        vendor.UpdatedAt = DateTime.UtcNow;

        await LogAudit("UPDATE", "Vendor", vendor.Id, oldValues, vendor);
        await _context.SaveChangesAsync();
        
        return Ok(vendor);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVendor(Guid id)
    {
        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.Id == id && v.CompanyId == _currentUser.CompanyId);
        if (vendor == null) return NotFound();

        _context.Vendors.Remove(vendor);
        await LogAudit("DELETE", "Vendor", vendor.Id, vendor, null);
        await _context.SaveChangesAsync();
        
        return NoContent();
    }

    private async Task LogAudit(string action, string entityType, Guid entityId, object? oldValues, object? newValues)
    {
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            CompanyId = _currentUser.CompanyId,
            UserId = _currentUser.UserId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : "",
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : "",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
            UserAgent = Request.Headers["User-Agent"].ToString(),
            CreatedAt = DateTime.UtcNow
        });
    }
}

public class VendorRequest { public string Name { get; set; } = ""; public string Code { get; set; } = ""; public string Email { get; set; } = ""; public string Phone { get; set; } = ""; public string Address { get; set; } = ""; public bool IsActive { get; set; } = true; }
