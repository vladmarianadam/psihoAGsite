using System.Linq.Expressions;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Articles.Dtos;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Articles.Queries;

/// <summary>
/// Articole recomandate sub un articol publicat: mai întâi din aceeași categorie,
/// apoi completate cu cele mai recente articole publicate (plan §7).
/// </summary>
public record GetRelatedArticlesQuery(string Slug, int Count = 3) : IRequest<IReadOnlyList<ArticleListItemDto>>;

public class GetRelatedArticlesQueryValidator : AbstractValidator<GetRelatedArticlesQuery>
{
    public GetRelatedArticlesQueryValidator()
    {
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(200)
            .WithMessage("Slug-ul articolului este obligatoriu (maxim 200 de caractere).");

        RuleFor(x => x.Count).InclusiveBetween(1, 12)
            .WithMessage("Numărul de articole recomandate trebuie să fie între 1 și 12.");
    }
}

public class GetRelatedArticlesQueryHandler
    : IRequestHandler<GetRelatedArticlesQuery, IReadOnlyList<ArticleListItemDto>>
{
    private static readonly Expression<Func<Article, ArticleListItemDto>> ToListItem = a => new ArticleListItemDto
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
    };

    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;

    public GetRelatedArticlesQueryHandler(IAppDbContext db, IDateTimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<IReadOnlyList<ArticleListItemDto>> Handle(
        GetRelatedArticlesQuery request,
        CancellationToken cancellationToken)
    {
        var slug = request.Slug.Trim().ToLowerInvariant();
        var now = _clock.UtcNow;

        var current = await _db.Articles
            .AsNoTracking()
            .Where(a => a.Slug == slug)
            .Select(a => new { a.Id, a.CategoryId })
            .FirstOrDefaultAsync(cancellationToken);

        // Slug inexistent → listă goală; secțiunea de recomandări dispare din pagină,
        // fără a genera un 404 secundar peste cel al articolului.
        if (current is null)
            return Array.Empty<ArticleListItemDto>();

        var published = _db.Articles
            .AsNoTracking()
            .Where(a => a.Status == ArticleStatus.Published
                        && a.PublishedAt != null
                        && a.PublishedAt <= now
                        && a.Id != current.Id);

        var results = new List<ArticleListItemDto>(request.Count);

        if (current.CategoryId is int categoryId)
        {
            var sameCategory = await published
                .Where(a => a.CategoryId == categoryId)
                .OrderByDescending(a => a.PublishedAt)
                .ThenByDescending(a => a.Id)
                .Take(request.Count)
                .Select(ToListItem)
                .ToListAsync(cancellationToken);

            results.AddRange(sameCategory);
        }

        if (results.Count < request.Count)
        {
            var alreadyIncluded = results.Select(r => r.Id).ToList();

            var fillers = await published
                .Where(a => !alreadyIncluded.Contains(a.Id))
                .OrderByDescending(a => a.PublishedAt)
                .ThenByDescending(a => a.Id)
                .Take(request.Count - results.Count)
                .Select(ToListItem)
                .ToListAsync(cancellationToken);

            results.AddRange(fillers);
        }

        return results;
    }
}
