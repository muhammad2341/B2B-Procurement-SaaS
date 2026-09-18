using Microsoft.AspNetCore.Authorization;
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
    public async Task<IActionResult> CreateWarehouse([FromBody] WarehouseRequest request)
    {
        if (await _context.Warehouses.AnyAsync(w => w.CompanyId == _currentUser.CompanyId && w.Code == request.Code))
            return BadRequest("Warehouse code already exists.");

        var w = new Warehouse
        {
            Id = Guid.NewGuid(),
            CompanyId = _currentUser.CompanyId,
            Name = request.Name,
            Code = request.Code,
            Location = request.Location,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Warehouses.Add(w);
        await _context.SaveChangesAsync();
        return Ok(w);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWarehouse(Guid id, [FromBody] WarehouseRequest request)
    {
        var w = await _context.Warehouses.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (w == null) return NotFound();

        if (w.Code != request.Code && await _context.Warehouses.AnyAsync(x => x.CompanyId == _currentUser.CompanyId && x.Code == request.Code))
            return BadRequest("Warehouse code already exists.");

        w.Name = request.Name;
        w.Code = request.Code;
        w.Location = request.Location;
        w.IsActive = request.IsActive;
        w.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(w);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWarehouse(Guid id)
    {
        var w = await _context.Warehouses.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (w == null) return NotFound();

        var hasStock = await _context.Stocks.AnyAsync(s => s.WarehouseId == id);
        if (hasStock) return BadRequest("Cannot delete warehouse with existing stock records.");

        _context.Warehouses.Remove(w);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class WarehouseRequest
{
    public string Name { get; set; } = "";
    public string Code { get; set; } = "";
    public string Location { get; set; } = "";
    public bool IsActive { get; set; } = true;
}
