using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcureHub.Application.Common;
using ProcureHub.Infrastructure.Persistence;

namespace ProcureHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ProcureHubDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DashboardController(ProcureHubDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var cid = _currentUser.CompanyId;

        var totalPR = await _context.PurchaseRequests.CountAsync(p => p.CompanyId == cid);
        var pendingApprovals = await _context.PurchaseRequests.CountAsync(p => p.CompanyId == cid && p.Status == Domain.Enums.PurchaseRequestStatus.PendingApproval);
        var totalPO = await _context.PurchaseOrders.CountAsync(p => p.CompanyId == cid);
        var totalInvoices = await _context.Invoices.CountAsync(i => i.CompanyId == cid);
        var unpaidInvoices = await _context.Invoices.CountAsync(i => i.CompanyId == cid && i.Status == Domain.Enums.InvoiceStatus.Unpaid);
        var totalVendors = await _context.Vendors.CountAsync(v => v.CompanyId == cid);
        var totalProducts = await _context.Products.CountAsync(p => p.CompanyId == cid);
        var totalStockItems = await _context.Stocks.CountAsync(s => s.CompanyId == cid);

        var lowStockItems = await _context.Stocks
            .Include(s => s.Product)
            .Where(s => s.CompanyId == cid && s.Quantity < s.Product.MinimumStock)
            .CountAsync();

        var recentLogs = await _context.AuditLogs
            .Where(a => a.CompanyId == cid)
            .OrderByDescending(a => a.CreatedAt)
            .Take(5)
            .ToListAsync();

        var userIds = recentLogs.Where(a => a.UserId.HasValue).Select(a => a.UserId!.Value).Distinct().ToList();
        var userNames = await _context.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Name })
            .ToDictionaryAsync(u => u.Id, u => u.Name);

        var recentActivity = recentLogs.Select(a => new
        {
            a.Id,
            a.Action,
            a.EntityType,
            a.EntityId,
            a.CreatedAt,
            UserName = a.UserId.HasValue && userNames.ContainsKey(a.UserId.Value) ? userNames[a.UserId.Value] : "System"
        });

        return Ok(new
        {
            totalPurchaseRequests = totalPR,
            pendingApprovals,
            totalPurchaseOrders = totalPO,
            totalInvoices,
            unpaidInvoices,
            totalVendors,
            totalProducts,
            totalStockItems,
            lowStockItems,
            recentActivity
        });
    }
}
