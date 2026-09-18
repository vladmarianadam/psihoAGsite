using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Common.Models;
using PsihoAdinaGghita.Application.Features.Articles.Commands;
using PsihoAdinaGghita.Application.Features.Articles.Dtos;
using PsihoAdinaGghita.Application.Features.Articles.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

/// <summary>Blogul public. Program.cs are FallbackPolicy autenticat, deci controllerul e explicit anonim.</summary>
[ApiController]
[AllowAnonymous]
[Route("api/articles")]
public class ArticlesController : ControllerBase
{
    private readonly ISender _sender;

    public ArticlesController(ISender sender) => _sender = sender;

    /// <summary>Articolele publicate, paginate, cu filtru de categorie și căutare.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ArticleListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ArticleListItemDto>>> GetPublished(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 9,
        [FromQuery] string? category = null,
        [FromQuery] string? q = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetPublishedArticlesQuery(page, pageSize, category, q), cancellationToken);
        return Ok(result);
    }

    /// <summary>Articolul publicat, după slug. Numărul de vizualizări crește la fiecare accesare.</summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(ArticleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ArticleDetailDto>> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var article = await _sender.Send(new GetArticleBySlugQuery(slug), cancellationToken);

        // ViewCount din răspuns este valoarea de dinaintea acestei afișări.
        await _sender.Send(new IncrementArticleViewCountCommand(article.Id), cancellationToken);

        return Ok(article);
    }

    /// <summary>Articole recomandate pentru finalul paginii de articol.</summary>
    [HttpGet("{slug}/related")]
    [ProducesResponseType(typeof(IReadOnlyList<ArticleListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ArticleListItemDto>>> GetRelated(
        string slug,
        [FromQuery] int count = 3,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetRelatedArticlesQuery(slug, count), cancellationToken);
        return Ok(result);
    }
}
