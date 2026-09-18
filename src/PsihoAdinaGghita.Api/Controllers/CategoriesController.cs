using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Features.Categories.Dtos;
using PsihoAdinaGghita.Application.Features.Categories.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

/// <summary>Categoriile de blog expuse public (plan §5).</summary>
[ApiController]
[Route("api/categories")]
[AllowAnonymous]
public class CategoriesController : ControllerBase
{
    private readonly ISender _sender;

    public CategoriesController(ISender sender) => _sender = sender;

    /// <summary>Categoriile ordonate, cu numărul de articole publicate.</summary>
    [HttpGet("")]
    [ProducesResponseType(typeof(IReadOnlyList<CategoryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetAll(CancellationToken cancellationToken)
        => Ok(await _sender.Send(new GetCategoriesQuery(), cancellationToken));
}
