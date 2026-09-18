using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Features.Services.Dtos;
using PsihoAdinaGghita.Application.Features.Services.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

/// <summary>Serviciile expuse public — doar cele active (plan §5).</summary>
[ApiController]
[Route("api/services")]
[AllowAnonymous]
public class ServicesController : ControllerBase
{
    private readonly ISender _sender;

    public ServicesController(ISender sender) => _sender = sender;

    /// <summary>Serviciile active, ordonate după DisplayOrder apoi denumire.</summary>
    [HttpGet("")]
    [ProducesResponseType(typeof(IReadOnlyList<ServiceListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ServiceListItemDto>>> GetAll(CancellationToken cancellationToken)
        => Ok(await _sender.Send(new GetActiveServicesQuery(), cancellationToken));

    /// <summary>Detaliul unui serviciu activ, după slug.</summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(ServiceDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceDetailDto>> GetBySlug(string slug, CancellationToken cancellationToken)
        => Ok(await _sender.Send(new GetServiceBySlugQuery(slug), cancellationToken));
}
