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
        request.Status = InvoiceStatus.Unpaid;
        request.CreatedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        _context.Invoices.Add(request);
        await _context.SaveChangesAsync();
        return Ok(request);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _context.Invoices
            .Include(i => i.Vendor)
            .Include(i => i.PurchaseOrder)
            .Where(i => i.CompanyId == _currentUser.CompanyId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Vendor)
            .Include(i => i.PurchaseOrder)
            .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (invoice == null) return NotFound();
        return Ok(invoice);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateInvoiceDto update)
    {
        var invoice = await _context.Invoices.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (invoice == null) return NotFound();
        if (invoice.Status != InvoiceStatus.Unpaid) return BadRequest("Only UNPAID invoices can be edited.");

        invoice.InvoiceNumber = update.InvoiceNumber ?? invoice.InvoiceNumber;
        invoice.TotalAmount = update.TotalAmount > 0 ? update.TotalAmount : invoice.TotalAmount;
        invoice.DueDate = update.DueDate != default ? update.DueDate : invoice.DueDate;
        invoice.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
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

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var invoice = await _context.Invoices.FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == _currentUser.CompanyId);
        if (invoice == null) return NotFound();
        if (invoice.Status == InvoiceStatus.Paid) return BadRequest("Cannot delete a paid invoice.");

        _context.Invoices.Remove(invoice);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class UpdateInvoiceDto
{
    public string? InvoiceNumber { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime DueDate { get; set; }
}
