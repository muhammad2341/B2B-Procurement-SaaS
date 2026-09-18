using ProcureHub.Domain.Enums;

namespace ProcureHub.Application.Common.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(
        Guid companyId,
        Guid? userId,
        AuditAction action,
        string entityType,
        Guid? entityId = null,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default);
}