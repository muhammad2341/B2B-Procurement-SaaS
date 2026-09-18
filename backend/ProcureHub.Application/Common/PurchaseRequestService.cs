using ProcureHub.Application.Common.Interfaces;

namespace ProcureHub.Application.Common;

public class PurchaseRequestService
{
    private readonly IAuditLogService _auditLogService;

    public PurchaseRequestService(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }
}