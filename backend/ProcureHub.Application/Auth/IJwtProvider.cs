using ProcureHub.Domain.Entities;
namespace ProcureHub.Application.Auth;
public interface IJwtProvider
{
    string Generate(User user);
}
