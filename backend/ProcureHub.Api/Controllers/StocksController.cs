using Microsoft.AspNetCore.Authorization;
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
            .Where(s => s.CompanyId == _currentUser.CompanyId)
            .ToListAsync();
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

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetStocksByProduct(Guid productId)
    {
        var productExists = await _context.Products.AnyAsync(p => p.Id == productId && p.CompanyId == _currentUser.CompanyId);
        if (!productExists) return NotFound("Product not found.");

        var stocks = await _context.Stocks
            .Include(s => s.Warehouse)
            .Where(s => s.CompanyId == _currentUser.CompanyId && s.ProductId == productId).ToListAsync();
        return Ok(stocks);
    }
}
