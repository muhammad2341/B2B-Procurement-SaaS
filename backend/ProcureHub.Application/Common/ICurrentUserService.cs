namespace ProcureHub.Application.Common;
public interface ICurrentUserService
{
    Guid UserId { get; }
    Guid CompanyId { get; }
}
