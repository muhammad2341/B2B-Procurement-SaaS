using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcureHub.Application.Common;
using ProcureHub.Domain.Entities;
using ProcureHub.Domain.Enums;
using ProcureHub.Infrastructure.Persistence;
using System.Text.Json;

namespace ProcureHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GoodsReceiptsController : ControllerBase
{
    private readonly ProcureHubDbContext _context;
    private readonly ICurrentUserService _currentUser;
    public GoodsReceiptsController(ProcureHubDbContext context, ICurrentUserService currentUser) { _context = context; _currentUser = currentUser; }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var receipts = await _context.GoodsReceipts
            .Include(gr => gr.PurchaseOrder)
            .Include(gr => gr.Warehouse)
            .Where(gr => gr.CompanyId == _currentUser.CompanyId)
            .OrderByDescending(gr => gr.CreatedAt)
            .ToListAsync();
        return Ok(receipts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var receipt = await _context.GoodsReceipts
            .Include(gr => gr.PurchaseOrder)
            .Include(gr => gr.Warehouse)
            .Include(gr => gr.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (receipt == null) return NotFound();
        return Ok(receipt);
    }

    [HttpPost]
    public async Task<IActionResult> ReceiveGoods([FromBody] GoodsReceipt request)
    {
        var po = await _context.PurchaseOrders.FirstOrDefaultAsync(x => x.Id == request.PurchaseOrderId && x.CompanyId == _currentUser.CompanyId);
        if (po == null) return NotFound("Purchase Order not found.");

        if (po.Status == PurchaseOrderStatus.Canceled || po.Status == PurchaseOrderStatus.Draft)
            return BadRequest("Cannot receive goods for this PO status.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            request.Id = Guid.NewGuid();
            request.CompanyId = _currentUser.CompanyId;
            request.Status = GoodsReceiptStatus.Completed;
            request.CreatedAt = DateTime.UtcNow;
            request.UpdatedAt = DateTime.UtcNow;

            foreach (var item in request.Items)
            {
                item.Id = Guid.NewGuid();
                item.GoodsReceiptId = request.Id;

                var stock = await _context.Stocks.FirstOrDefaultAsync(s => s.WarehouseId == request.WarehouseId && s.ProductId == item.ProductId);
                if (stock == null)
                {
                    stock = new Stock
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = _currentUser.CompanyId,
                        WarehouseId = request.WarehouseId,
                        ProductId = item.ProductId,
                        Quantity = item.QuantityReceived,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Stocks.Add(stock);
                }
                else
                {
                    stock.Quantity += item.QuantityReceived;
                    stock.UpdatedAt = DateTime.UtcNow;
                }
            }

            _context.GoodsReceipts.Add(request);

            _context.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(), CompanyId = _currentUser.CompanyId, UserId = _currentUser.UserId,
                Action = "RECEIVE", EntityType = "GoodsReceipt", EntityId = request.Id,
                OldValues = "", NewValues = JsonSerializer.Serialize(request),
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
                UserAgent = Request.Headers["User-Agent"].ToString(),
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return Ok(request);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, "Transaction failed: " + ex.Message);
        }
    }
}
