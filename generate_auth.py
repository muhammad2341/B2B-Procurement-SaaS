import os

domain_dir = r"d:\Portofolio\SaaS\backend\ProcureHub.Domain\Constants"
app_dir = r"d:\Portofolio\SaaS\backend\ProcureHub.Application\Auth"
api_dir = r"d:\Portofolio\SaaS\backend\ProcureHub.Api\Controllers"
infra_dir = r"d:\Portofolio\SaaS\backend\ProcureHub.Infrastructure\Auth"

os.makedirs(domain_dir, exist_ok=True)
os.makedirs(app_dir, exist_ok=True)
os.makedirs(api_dir, exist_ok=True)
os.makedirs(infra_dir, exist_ok=True)

files = {
    os.path.join(domain_dir, "Roles.cs"): """namespace ProcureHub.Domain.Constants;
public static class Roles
{
    public const string Owner = "OWNER";
    public const string Admin = "ADMIN";
    public const string Employee = "EMPLOYEE";
    public const string Manager = "MANAGER";
    public const string Procurement = "PROCUREMENT";
    public const string Warehouse = "WAREHOUSE";
    public const string Finance = "FINANCE";
}
""",
    os.path.join(app_dir, "IJwtProvider.cs"): """using ProcureHub.Domain.Entities;
namespace ProcureHub.Application.Auth;
public interface IJwtProvider
{
    string Generate(User user);
}
""",
    os.path.join(app_dir, "IPasswordHasher.cs"): """namespace ProcureHub.Application.Auth;
public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string passwordHash);
}
""",
    os.path.join(infra_dir, "PasswordHasher.cs"): """using System.Security.Cryptography;
using ProcureHub.Application.Auth;
namespace ProcureHub.Infrastructure.Auth;
public class PasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        // Simple mock for speed, use BCrypt in real app
        return password + "_hashed";
    }
    public bool Verify(string password, string passwordHash)
    {
        return password + "_hashed" == passwordHash;
    }
}
""",
    os.path.join(infra_dir, "JwtProvider.cs"): """using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ProcureHub.Application.Auth;
using ProcureHub.Domain.Entities;

namespace ProcureHub.Infrastructure.Auth;
public class JwtProvider : IJwtProvider
{
    private readonly IConfiguration _config;
    public JwtProvider(IConfiguration config)
    {
        _config = config;
    }
    
    public string Generate(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim("userId", user.Id.ToString()),
            new Claim("companyId", user.CompanyId.ToString()),
            new Claim("role", user.Role),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("email", user.Email)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"] ?? "super_secret_key_1234567890_min_32_chars"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
""",
    os.path.join(api_dir, "AuthController.cs"): """using Microsoft.AspNetCore.Mvc;
using ProcureHub.Application.Auth;
using ProcureHub.Domain.Entities;
using ProcureHub.Domain.Constants;
using ProcureHub.Infrastructure.Persistence;

namespace ProcureHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ProcureHubDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;

    public AuthController(ProcureHubDbContext context, IPasswordHasher passwordHasher, IJwtProvider jwtProvider)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
    }

    [HttpPost("register-company")]
    public IActionResult RegisterCompany([FromBody] RegisterRequest request)
    {
        var company = new Company { Id = Guid.NewGuid(), Name = request.CompanyName, Code = request.CompanyCode, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _context.Companies.Add(company);

        var user = new User
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Name = request.UserName,
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = Roles.Owner,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        return Ok(new { Message = "Company registered successfully" });
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);
        if (user == null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            return Unauthorized("Invalid credentials");

        var token = _jwtProvider.Generate(user);
        return Ok(new { Token = token });
    }
}

public class RegisterRequest { public string CompanyName { get; set; } = ""; public string CompanyCode { get; set; } = ""; public string UserName { get; set; } = ""; public string Email { get; set; } = ""; public string Password { get; set; } = ""; }
public class LoginRequest { public string Email { get; set; } = ""; public string Password { get; set; } = ""; }
"""
}

for path, content in files.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
