import os

api_dir = r"d:\Portofolio\SaaS\backend\ProcureHub.Api\Controllers"
os.makedirs(api_dir, exist_ok=True)

files = {
    os.path.join(api_dir, "PurchaseOrdersController.cs"): """using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcureHub.Application.Common;
using ProcureHub.Domain.Entities;
using ProcureHub.Domain.Enums;
using ProcureHub.Infrastructure.Persistence;

namespace ProcureHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchaseOrdersController : ControllerBase
{
    private readonly ProcureHubDbContext _context;
    private readonly ICurrentUserService _currentUser;
    public PurchaseOrdersController(ProcureHubDbContext context, ICurrentUserService currentUser) { _context = context; _currentUser = currentUser; }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PurchaseOrder request)
    {
        request.Id = Guid.NewGuid();
        request.CompanyId = _currentUser.CompanyId;
        request.Status = PurchaseOrderStatus.Draft;
        request.CreatedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        _context.PurchaseOrders.Add(request);
        await _context.SaveChangesAsync();
        return Ok(request);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var pos = await _context.PurchaseOrders
            .Include(po => po.Vendor)
            .Include(po => po.PurchaseRequest)
            .Where(po => po.CompanyId == _currentUser.CompanyId).ToListAsync();
        return Ok(pos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var po = await _context.PurchaseOrders
            .Include(po => po.Items)
            .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (po == null) return NotFound();
        return Ok(po);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PurchaseOrder update)
    {
        var po = await _context.PurchaseOrders.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (po == null) return NotFound();
        if (po.Status != PurchaseOrderStatus.Draft) return BadRequest("Only DRAFT purchase orders can be edited.");
        
        po.PONumber = update.PONumber;
        po.TotalAmount = update.TotalAmount;
        po.VendorId = update.VendorId;
        po.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(po);
    }

    [HttpPost("{id}/issue")]
    public async Task<IActionResult> Issue(Guid id)
    {
        var po = await _context.PurchaseOrders.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (po == null) return NotFound();
        if (po.Status != PurchaseOrderStatus.Draft) return BadRequest("Only DRAFT orders can be issued.");
        
        po.Status = PurchaseOrderStatus.Issued;
        po.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(po);
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var po = await _context.PurchaseOrders.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (po == null) return NotFound();
        
        po.Status = PurchaseOrderStatus.Canceled;
        po.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(po);
    }
}
""",
    os.path.join(api_dir, "GoodsReceiptsController.cs"): """using Microsoft.AspNetCore.Authorization;
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

                // Stock Update logic
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

            // Audit
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
""",
    os.path.join(api_dir, "InvoicesController.cs"): """using Microsoft.AspNetCore.Authorization;
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
public class InvoicesController : ControllerBase
{
    private readonly ProcureHubDbContext _context;
    private readonly ICurrentUserService _currentUser;
    public InvoicesController(ProcureHubDbContext context, ICurrentUserService currentUser) { _context = context; _currentUser = currentUser; }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Invoice request)
    {
        request.Id = Guid.NewGuid();
        request.CompanyId = _currentUser.CompanyId;
        request.Status = InvoiceStatus.Unpaid; // Maps to PENDING
        request.CreatedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        _context.Invoices.Add(request);
        await _context.SaveChangesAsync();
        return Ok(request);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _context.Invoices.Where(i => i.CompanyId == _currentUser.CompanyId).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var invoice = await _context.Invoices.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (invoice == null) return NotFound();
        return Ok(invoice);
    }

    [HttpPost("{id}/pay")]
    public async Task<IActionResult> Pay(Guid id)
    {
        var invoice = await _context.Invoices.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (invoice == null) return NotFound();
        
        var oldValues = JsonSerializer.Serialize(invoice);
        invoice.Status = InvoiceStatus.Paid;
        invoice.UpdatedAt = DateTime.UtcNow;

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(), CompanyId = _currentUser.CompanyId, UserId = _currentUser.UserId,
            Action = "PAYMENT", EntityType = "Invoice", EntityId = invoice.Id,
            OldValues = oldValues, NewValues = JsonSerializer.Serialize(invoice),
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "",
            UserAgent = Request.Headers["User-Agent"].ToString(),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(invoice);
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var invoice = await _context.Invoices.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (invoice == null) return NotFound();
        
        invoice.Status = InvoiceStatus.Canceled;
        invoice.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(invoice);
    }
}
"""
}

for path, content in files.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
