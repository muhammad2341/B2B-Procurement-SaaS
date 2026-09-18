using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcureHub.Application.Common;
using ProcureHub.Domain.Entities;
using ProcureHub.Infrastructure.Persistence;

namespace ProcureHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly ProcureHubDbContext _context;
    private readonly ICurrentUserService _currentUser;
    public DepartmentsController(ProcureHubDbContext context, ICurrentUserService currentUser) { _context = context; _currentUser = currentUser; }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var departments = await _context.Departments
            .Where(d => d.CompanyId == _currentUser.CompanyId)
            .ToListAsync();
        return Ok(departments);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var dept = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == _currentUser.CompanyId);
        if (dept == null) return NotFound();
        return Ok(dept);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DepartmentRequest request)
    {
        if (await _context.Departments.AnyAsync(d => d.CompanyId == _currentUser.CompanyId && d.Code == request.Code))
            return BadRequest("Department code already exists.");

        var dept = new Department
        {
            Id = Guid.NewGuid(),
            CompanyId = _currentUser.CompanyId,
            Name = request.Name,
            Code = request.Code
        };

        _context.Departments.Add(dept);
        await _context.SaveChangesAsync();
        return Ok(dept);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] DepartmentRequest request)
    {
        var dept = await _context.Departments.FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == _currentUser.CompanyId);
        if (dept == null) return NotFound();

        if (dept.Code != request.Code && await _context.Departments.AnyAsync(d => d.CompanyId == _currentUser.CompanyId && d.Code == request.Code))
            return BadRequest("Department code already exists.");

        dept.Name = request.Name;
        dept.Code = request.Code;
        await _context.SaveChangesAsync();
        return Ok(dept);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var dept = await _context.Departments.FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == _currentUser.CompanyId);
        if (dept == null) return NotFound();

        var hasUsers = await _context.Users.AnyAsync(u => u.DepartmentId == id);
        if (hasUsers) return BadRequest("Cannot delete department with assigned users.");

        _context.Departments.Remove(dept);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class DepartmentRequest
{
    public string Name { get; set; } = "";
    public string Code { get; set; } = "";
}
