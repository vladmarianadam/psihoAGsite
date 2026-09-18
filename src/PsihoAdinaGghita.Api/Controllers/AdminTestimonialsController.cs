using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Features.Testimonials.Commands;
using PsihoAdinaGghita.Application.Features.Testimonials.Dtos;
using PsihoAdinaGghita.Application.Features.Testimonials.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/testimonials")]
public class AdminTestimonialsController : ControllerBase
{
    private readonly ISender _sender;
    public AdminTestimonialsController(ISender sender) => _sender = sender;

    /// <summary>Toate testimonialele, inclusiv cele neaprobate.</summary>
    [HttpGet("")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminTestimonialDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAdminTestimonialsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(AdminTestimonialDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAdminTestimonialByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost("")]
    [ProducesResponseType(typeof(int), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateTestimonialCommand command,
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
        [FromBody] UpdateTestimonialCommand command,
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
        await _sender.Send(new DeleteTestimonialCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:int}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Approve(
        int id,
        [FromBody] ApproveTestimonialCommand command,
        CancellationToken cancellationToken)
    {
        await _sender.Send(command with { Id = id }, cancellationToken);
        return NoContent();
    }
}
