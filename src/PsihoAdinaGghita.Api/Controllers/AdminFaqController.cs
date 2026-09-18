using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Features.Faq.Commands;
using PsihoAdinaGghita.Application.Features.Faq.Dtos;
using PsihoAdinaGghita.Application.Features.Faq.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/faq")]
public class AdminFaqController : ControllerBase
{
    private readonly ISender _sender;
    public AdminFaqController(ISender sender) => _sender = sender;

    /// <summary>Toate întrebările frecvente, inclusiv cele inactive.</summary>
    [HttpGet("")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminFaqItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAdminFaqQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(AdminFaqItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAdminFaqItemByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost("")]
    [ProducesResponseType(typeof(int), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateFaqItemCommand command,
        CancellationToken cancellationToken)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateFaqItemCommand command,
        CancellationToken cancellationToken)
    {
        // Id-ul din rută este sursa de adevăr.
        await _sender.Send(command with { Id = id }, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _sender.Send(new DeleteFaqItemCommand(id), cancellationToken);
        return NoContent();
    }
}
