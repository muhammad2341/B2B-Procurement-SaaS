using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    public async Task<IActionResult> RegisterCompany([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CompanyName))
            return BadRequest(new { Success = false, Message = "Company name is required." });

        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { Success = false, Message = "Email is required." });

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(new { Success = false, Message = "Password must be at least 6 characters." });

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            return Conflict(new { Success = false, Message = "Email already registered." });

        if (await _context.Companies.AnyAsync(c => c.Code == request.CompanyCode))
            return Conflict(new { Success = false, Message = "Company code already exists." });

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = request.CompanyName,
            Code = request.CompanyCode,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
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
        await _context.SaveChangesAsync();

        return CreatedAtAction(null, null, new { Message = "Company registered successfully" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { Success = false, Message = "Email and password are required." });

        var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);
        if (user == null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { Success = false, Message = "Invalid credentials." });

        if (!user.IsActive)
            return Unauthorized(new { Success = false, Message = "Account is deactivated." });

        var token = _jwtProvider.Generate(user);
        return Ok(new { Success = true, Message = "Login successful", Data = new { Token = token, Role = user.Role, UserName = user.Name } });
    }
}

public class RegisterRequest
{
    public string CompanyName { get; set; } = "";
    public string CompanyCode { get; set; } = "";
    public string UserName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}
