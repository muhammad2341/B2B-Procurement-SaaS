using Microsoft.AspNetCore.Authorization;
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
    public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderDto dto)
    {
        var po = new PurchaseOrder
        {
            Id = Guid.NewGuid(),
            CompanyId = _currentUser.CompanyId,
            PurchaseRequestId = dto.PurchaseRequestId,
            VendorId = dto.VendorId,
            PONumber = await GeneratePONumber(),
            Status = PurchaseOrderStatus.Draft,
            TotalAmount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (dto.Items != null && dto.Items.Count > 0)
        {
            foreach (var item in dto.Items)
            {
                po.Items.Add(new PurchaseOrderItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.Quantity * item.UnitPrice
                });
            }
            po.TotalAmount = po.Items.Sum(i => i.TotalPrice);
        }

        _context.PurchaseOrders.Add(po);
        await _context.SaveChangesAsync();
        return Ok(po);
    }

    [HttpPost("from-request/{purchaseRequestId}")]
    public async Task<IActionResult> CreateFromRequest(Guid purchaseRequestId, [FromBody] CreateFromRequestDto dto)
    {
        var pr = await _context.PurchaseRequests
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == purchaseRequestId && x.CompanyId == _currentUser.CompanyId);
        if (pr == null) return NotFound("Purchase Request not found.");
        if (pr.Status != PurchaseRequestStatus.Approved)
            return BadRequest("Only APPROVED requests can be converted to Purchase Orders.");

        var po = new PurchaseOrder
        {
            Id = Guid.NewGuid(),
            CompanyId = _currentUser.CompanyId,
            PurchaseRequestId = pr.Id,
            VendorId = dto.VendorId,
            PONumber = await GeneratePONumber(),
            Status = PurchaseOrderStatus.Draft,
            TotalAmount = pr.TotalAmount,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        foreach (var prItem in pr.Items)
        {
            po.Items.Add(new PurchaseOrderItem
            {
                Id = Guid.NewGuid(),
                ProductId = prItem.ProductId,
                Quantity = prItem.Quantity,
                UnitPrice = prItem.UnitPrice,
                TotalPrice = prItem.TotalPrice
            });
        }

        _context.PurchaseOrders.Add(po);
        await _context.SaveChangesAsync();
        return Ok(po);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var pos = await _context.PurchaseOrders
            .Include(po => po.Vendor)
            .Include(po => po.PurchaseRequest)
            .Where(po => po.CompanyId == _currentUser.CompanyId)
            .OrderByDescending(po => po.CreatedAt)
            .ToListAsync();
        return Ok(pos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var po = await _context.PurchaseOrders
            .Include(po => po.Items).ThenInclude(i => i.Product)
            .Include(po => po.Vendor)
            .Include(po => po.PurchaseRequest)
            .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (po == null) return NotFound();
        return Ok(po);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePurchaseOrderDto update)
    {
        var po = await _context.PurchaseOrders
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (po == null) return NotFound();
        if (po.Status != PurchaseOrderStatus.Draft) return BadRequest("Only DRAFT purchase orders can be edited.");

        po.PONumber = update.PONumber ?? po.PONumber;
        po.VendorId = update.VendorId != Guid.Empty ? update.VendorId : po.VendorId;

        if (update.Items != null)
        {
            var existingItems = po.Items.ToList();
            _context.PurchaseOrderItems.RemoveRange(existingItems);
            po.Items.Clear();

            foreach (var item in update.Items)
            {
                var newItem = new PurchaseOrderItem
                {
                    Id = Guid.NewGuid(),
                    PurchaseOrderId = po.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.Quantity * item.UnitPrice
                };
                po.Items.Add(newItem);
            }
            po.TotalAmount = po.Items.Sum(i => i.TotalPrice);
        }

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

    private async Task<string> GeneratePONumber()
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"PO-{today}-";
        var lastNumber = await _context.PurchaseOrders
            .Where(po => po.CompanyId == _currentUser.CompanyId && po.PONumber.StartsWith(prefix))
            .CountAsync();
        return $"{prefix}{(lastNumber + 1):D4}";
    }
}

public class CreatePurchaseOrderDto
{
    public Guid PurchaseRequestId { get; set; }
    public Guid VendorId { get; set; }
    public List<PurchaseOrderItemDto>? Items { get; set; }
}

public class CreateFromRequestDto
{
    public Guid VendorId { get; set; }
}

public class UpdatePurchaseOrderDto
{
    public string? PONumber { get; set; }
    public Guid VendorId { get; set; }
    public List<PurchaseOrderItemDto>? Items { get; set; }
}

public class PurchaseOrderItemDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
