using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Common.Models;
using PsihoAdinaGghita.Application.Features.Articles.Dtos;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Articles.Queries;

/// <summary>Listarea publică a articolelor publicate, paginată, cu filtru de categorie și căutare (plan §7).</summary>
public record GetPublishedArticlesQuery(
    int Page = 1,
    int PageSize = 9,
    string? Category = null,
    string? Q = null) : IRequest<PagedResult<ArticleListItemDto>>;

public class GetPublishedArticlesQueryValidator : AbstractValidator<GetPublishedArticlesQuery>
{
    public GetPublishedArticlesQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1)
            .WithMessage("Pagina trebuie să fie cel puțin 1.");

        RuleFor(x => x.PageSize).InclusiveBetween(1, 50)
            .WithMessage("Dimensiunea paginii trebuie să fie între 1 și 50.");
    }
}

public class GetPublishedArticlesQueryHandler
    : IRequestHandler<GetPublishedArticlesQuery, PagedResult<ArticleListItemDto>>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;

    public GetPublishedArticlesQueryHandler(IAppDbContext db, IDateTimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<PagedResult<ArticleListItemDto>> Handle(
        GetPublishedArticlesQuery request,
        CancellationToken cancellationToken)
    {
        var now = _clock.UtcNow;

        var query = _db.Articles
            .AsNoTracking()
            .Where(a => a.Status == ArticleStatus.Published && a.PublishedAt != null && a.PublishedAt <= now);

        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            var categorySlug = request.Category.Trim().ToLowerInvariant();
            query = query.Where(a => a.Category != null && a.Category.Slug == categorySlug);
        }

        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            // LIKE pe SQLite este deja case-insensitive pentru ASCII, deci nu forțăm ToLower()
            // (ar împiedica folosirea indexului și ar strica diacriticele).
            var pattern = $"%{request.Q.Trim()}%";
            query = query.Where(a => EF.Functions.Like(a.Title, pattern) || EF.Functions.Like(a.Excerpt, pattern));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(a => a.PublishedAt)
            .ThenByDescending(a => a.Id)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new ArticleListItemDto
            {
                Id = a.Id,
                Title = a.Title,
                Slug = a.Slug,
                Excerpt = a.Excerpt,
                CoverImageUrl = a.CoverImageUrl,
                CoverImageAlt = a.CoverImageAlt,
                CategoryName = a.Category != null ? a.Category.Name : null,
                CategorySlug = a.Category != null ? a.Category.Slug : null,
                PublishedAt = a.PublishedAt,
                ReadingMinutes = a.ReadingMinutes,
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<ArticleListItemDto>(items, request.Page, request.PageSize, totalCount);
    }
}
