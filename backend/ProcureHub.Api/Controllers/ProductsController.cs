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
public class ProductsController : ControllerBase
{
    private readonly ProcureHubDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ProductsController(ProcureHubDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.Products.Where(p => p.CompanyId == _currentUser.CompanyId);
        
        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.Name.Contains(search) || p.SKU.Contains(search));

        var total = await query.CountAsync();
        var products = await query.OrderByDescending(p => p.CreatedAt)
                                  .Skip((page - 1) * pageSize)
                                  .Take(pageSize)
                                  .ToListAsync();
                                 
        return Ok(new { Total = total, Data = products });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProduct(Guid id)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id && p.CompanyId == _currentUser.CompanyId);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] ProductRequest request)
    {
        // SKU uniqueness validation
        if (await _context.Products.AnyAsync(p => p.CompanyId == _currentUser.CompanyId && p.SKU == request.SKU))
            return BadRequest("SKU must be unique within the company.");

        var product = new Product
        {
            Id = Guid.NewGuid(),
            CompanyId = _currentUser.CompanyId,
            SKU = request.SKU,
            Name = request.Name,
            Description = request.Description,
            Unit = request.Unit,
            MinimumStock = request.MinimumStock,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        _context.Products.Add(product);
        await LogAudit("CREATE", "Product", product.Id, null, product);
        await _context.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] ProductRequest request)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id && p.CompanyId == _currentUser.CompanyId);
        if (product == null) return NotFound();

        if (product.SKU != request.SKU && await _context.Products.AnyAsync(p => p.CompanyId == _currentUser.CompanyId && p.SKU == request.SKU))
            return BadRequest("SKU must be unique within the company.");

        var oldValues = JsonSerializer.Serialize(product);

        product.SKU = request.SKU;
        product.Name = request.Name;
        product.Description = request.Description;
        product.Unit = request.Unit;
        product.MinimumStock = request.MinimumStock;
        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await LogAudit("UPDATE", "Product", product.Id, oldValues, product);
        await _context.SaveChangesAsync();
        
        return Ok(product);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id && p.CompanyId == _currentUser.CompanyId);
        if (product == null) return NotFound();

        _context.Products.Remove(product);
        await LogAudit("DELETE", "Product", product.Id, product, null);
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

public class ProductRequest { public string SKU { get; set; } = ""; public string Name { get; set; } = ""; public string Description { get; set; } = ""; public string Unit { get; set; } = ""; public int MinimumStock { get; set; } = 0; public bool IsActive { get; set; } = true; }
