using System.Text.Json;
using ProcureHub.Application.Common.Interfaces;
using ProcureHub.Domain.Entities;
using ProcureHub.Domain.Enums;
using ProcureHub.Infrastructure.Persistence;

namespace ProcureHub.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly ProcureHubDbContext _context;

    public AuditLogService(
        ProcureHubDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(
        Guid companyId,
        Guid? userId,
        AuditAction action,
        string entityType,
        Guid? entityId = null,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default)
    {
        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),

            CompanyId = companyId,

            UserId = userId,

            Action = action.ToString(),

            EntityType = entityType,

            EntityId = entityId,

            OldValues = oldValues is null
                ? null
                : JsonSerializer.Serialize(oldValues),

            NewValues = newValues is null
                ? null
                : JsonSerializer.Serialize(newValues),

            IpAddress = ipAddress,

            UserAgent = userAgent,

            CreatedAt = DateTime.UtcNow
        };

        await _context.AuditLogs.AddAsync(
            auditLog,
            cancellationToken);

        await _context.SaveChangesAsync(
            cancellationToken);
    }
}