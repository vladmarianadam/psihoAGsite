using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Features.Testimonials.Dtos;
using PsihoAdinaGghita.Application.Features.Testimonials.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

[ApiController]
[Route("api/testimonials")]
[AllowAnonymous]
public class TestimonialsController : ControllerBase
{
    private readonly ISender _sender;
    public TestimonialsController(ISender sender) => _sender = sender;

    /// <summary>Testimonialele aprobate, în ordinea de afișare.</summary>
    [HttpGet("")]
    [ProducesResponseType(typeof(IReadOnlyList<TestimonialDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetApprovedTestimonialsQuery(), cancellationToken);
        return Ok(result);
    }
}
