using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Common.Models;
using PsihoAdinaGghita.Application.Features.Articles.Commands;
using PsihoAdinaGghita.Application.Features.Articles.Dtos;
using PsihoAdinaGghita.Application.Features.Articles.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

/// <summary>Administrarea articolelor — necesită JWT (plan §7).</summary>
[ApiController]
[Authorize]
[Route("api/admin/articles")]
public class AdminArticlesController : ControllerBase
{
    private readonly ISender _sender;

    public AdminArticlesController(ISender sender) => _sender = sender;

    /// <summary>Toate articolele (inclusiv ciornele), ordonate după ultima modificare.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AdminArticleListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AdminArticleListItemDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? q = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetAdminArticlesQuery(page, pageSize, status, q), cancellationToken);
        return Ok(result);
    }

    /// <summary>Articolul complet pentru formularul de editare.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(AdminArticleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminArticleDetailDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAdminArticleByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    /// <summary>Creează un articol nou.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateArticleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CreateArticleResponse>> Create(
        [FromBody] CreateArticleCommand command,
        CancellationToken cancellationToken)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id }, new CreateArticleResponse(id));
    }

    /// <summary>Actualizează un articol existent.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateArticleCommand command,
        CancellationToken cancellationToken)
    {
        // Id-ul din rută este singura sursă de adevăr.
        await _sender.Send(command with { Id = id }, cancellationToken);
        return NoContent();
    }

    /// <summary>Șterge definitiv un articol.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _sender.Send(new DeleteArticleCommand(id), cancellationToken);
        return NoContent();
    }

    /// <summary>Publică sau retrage articolul în ciornă.</summary>
    [HttpPost("{id:int}/publish")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Publish(
        int id,
        [FromBody] PublishArticleRequest request,
        CancellationToken cancellationToken)
    {
        await _sender.Send(new PublishArticleCommand(id, request.Publish), cancellationToken);
        return NoContent();
    }
}

/// <summary>Corpul cererii de publicare/retragere.</summary>
public record PublishArticleRequest(bool Publish);

/// <summary>Răspunsul la creare — id-ul articolului nou.</summary>
public record CreateArticleResponse(int Id);
