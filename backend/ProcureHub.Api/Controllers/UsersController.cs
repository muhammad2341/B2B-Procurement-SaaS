using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcureHub.Application.Auth;
using ProcureHub.Application.Common;
using ProcureHub.Domain.Constants;
using ProcureHub.Domain.Entities;
using ProcureHub.Infrastructure.Persistence;

namespace ProcureHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = Roles.Owner + "," + Roles.Admin)]
public class UsersController : ControllerBase
{
    private readonly ProcureHubDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IPasswordHasher _passwordHasher;
    public UsersController(ProcureHubDbContext context, ICurrentUserService currentUser, IPasswordHasher passwordHasher)
    {
        _context = context;
        _currentUser = currentUser;
        _passwordHasher = passwordHasher;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _context.Users
            .Where(u => u.CompanyId == _currentUser.CompanyId)
            .Select(u => new
            {
                u.Id, u.Name, u.Email, u.Role, u.IsActive, u.DepartmentId,
                DepartmentName = u.Department != null ? u.Department.Name : null,
                u.CreatedAt
            })
            .ToListAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var user = await _context.Users
            .Where(u => u.Id == id && u.CompanyId == _currentUser.CompanyId)
            .Select(u => new
            {
                u.Id, u.Name, u.Email, u.Role, u.IsActive, u.DepartmentId,
                DepartmentName = u.Department != null ? u.Department.Name : null,
                u.CreatedAt
            })
            .FirstOrDefaultAsync();
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.CompanyId == _currentUser.CompanyId && u.Email == request.Email))
            return Conflict("Email already exists in this company.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            CompanyId = _currentUser.CompanyId,
            Name = request.Name,
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = string.IsNullOrEmpty(request.Role) ? Roles.Employee : request.Role,
            DepartmentId = request.DepartmentId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return Ok(new { user.Id, user.Name, user.Email, user.Role, user.IsActive });
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.CompanyId == _currentUser.CompanyId);
        if (user == null) return NotFound();

        if (user.Id == _currentUser.UserId)
            return BadRequest("Cannot change your own role.");

        user.Role = request.Role;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { user.Id, user.Name, user.Role });
    }

    [HttpPost("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.CompanyId == _currentUser.CompanyId);
        if (user == null) return NotFound();

        if (user.Id == _currentUser.UserId)
            return BadRequest("Cannot deactivate your own account.");

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { user.Id, user.Name, user.IsActive });
    }

    [HttpPost("{id}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.CompanyId == _currentUser.CompanyId);
        if (user == null) return NotFound();

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { user.Id, user.Name, user.IsActive });
    }
}

public class CreateUserRequest
{
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string? Role { get; set; }
    public Guid? DepartmentId { get; set; }
}

public class UpdateRoleRequest
{
    public string Role { get; set; } = "";
}
