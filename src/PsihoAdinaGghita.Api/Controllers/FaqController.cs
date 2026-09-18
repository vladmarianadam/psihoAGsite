using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Features.Faq.Dtos;
using PsihoAdinaGghita.Application.Features.Faq.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

[ApiController]
[Route("api/faq")]
[AllowAnonymous]
public class FaqController : ControllerBase
{
    private readonly ISender _sender;
    public FaqController(ISender sender) => _sender = sender;

    /// <summary>Întrebările frecvente active, în ordinea de afișare.</summary>
    [HttpGet("")]
    [ProducesResponseType(typeof(IReadOnlyList<FaqItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetActiveFaqQuery(), cancellationToken);
        return Ok(result);
    }
}
