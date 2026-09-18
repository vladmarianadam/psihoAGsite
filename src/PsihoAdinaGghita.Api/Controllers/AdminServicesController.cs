using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Features.Services.Commands;
using PsihoAdinaGghita.Application.Features.Services.Dtos;
using PsihoAdinaGghita.Application.Features.Services.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

/// <summary>CRUD servicii pentru panoul de management, inclusiv cele inactive (plan §5).</summary>
[ApiController]
[Route("api/admin/services")]
[Authorize]
public class AdminServicesController : ControllerBase
{
    private readonly ISender _sender;

    public AdminServicesController(ISender sender) => _sender = sender;

    [HttpGet("")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminServiceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminServiceDto>>> GetAll(CancellationToken cancellationToken)
        => Ok(await _sender.Send(new GetAdminServicesQuery(), cancellationToken));

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(AdminServiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminServiceDto>> GetById(int id, CancellationToken cancellationToken)
        => Ok(await _sender.Send(new GetAdminServiceByIdQuery(id), cancellationToken));

    [HttpPost("")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateServiceCommand command, CancellationToken cancellationToken)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceCommand command, CancellationToken cancellationToken)
    {
        // Id-ul din rută este singura sursă de adevăr, indiferent de ce trimite corpul cererii.
        await _sender.Send(command with { Id = id }, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _sender.Send(new DeleteServiceCommand(id), cancellationToken);
        return NoContent();
    }
}
