using System.Security.Claims;
using ProcureHub.Application.Common;

namespace ProcureHub.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }
    
    public Guid UserId 
    {
        get
        {
            var id = _httpContextAccessor.HttpContext?.User?.FindFirstValue("userId");
            return string.IsNullOrEmpty(id) ? Guid.Empty : Guid.Parse(id);
        }
    }
    
    public Guid CompanyId 
    {
        get
        {
            var id = _httpContextAccessor.HttpContext?.User?.FindFirstValue("companyId");
            return string.IsNullOrEmpty(id) ? Guid.Empty : Guid.Parse(id);
        }
    }
}
