using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Features.Dashboard.Dtos;
using PsihoAdinaGghita.Application.Features.Dashboard.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/dashboard")]
public class AdminDashboardController : ControllerBase
{
    private readonly ISender _sender;
    public AdminDashboardController(ISender sender) => _sender = sender;

    /// <summary>Statisticile afișate pe prima pagină a zonei de administrare.</summary>
    [HttpGet("")]
    [ProducesResponseType(typeof(DashboardStatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardStatsDto>> Get(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetDashboardStatsQuery(), cancellationToken);
        return Ok(result);
    }
}
