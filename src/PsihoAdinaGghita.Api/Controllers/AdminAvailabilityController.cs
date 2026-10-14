using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Features.Availability.Commands;
using PsihoAdinaGghita.Application.Features.Availability.Dtos;
using PsihoAdinaGghita.Application.Features.Availability.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

/// <summary>Pagina Disponibilitate: setări, programul săptămânal și excepțiile.</summary>
[ApiController]
[Authorize]
[Route("api/admin/availability")]
public class AdminAvailabilityController : ControllerBase
{
    private readonly ISender _sender;

    public AdminAvailabilityController(ISender sender) => _sender = sender;

    [HttpGet("")]
    [ProducesResponseType(typeof(AvailabilityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AvailabilityDto>> Get(CancellationToken cancellationToken)
        => Ok(await _sender.Send(new GetAvailabilityQuery(), cancellationToken));

    [HttpPut("settings")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateSettings(
        [FromBody] UpdateBookingSettingsCommand command,
        CancellationToken cancellationToken)
    {
        await _sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPut("rules")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ReplaceRules(
        [FromBody] ReplaceAvailabilityRulesCommand command,
        CancellationToken cancellationToken)
    {
        await _sender.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPost("exceptions")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateException(
        [FromBody] CreateAvailabilityExceptionCommand command,
        CancellationToken cancellationToken)
    {
        var id = await _sender.Send(command, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, new { id });
    }

    [HttpDelete("exceptions/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteException(int id, CancellationToken cancellationToken)
    {
        await _sender.Send(new DeleteAvailabilityExceptionCommand(id), cancellationToken);
        return NoContent();
    }
}
