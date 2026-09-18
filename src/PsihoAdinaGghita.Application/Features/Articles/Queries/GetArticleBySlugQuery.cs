using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Articles.Dtos;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Articles.Queries;

/// <summary>
/// Articolul public, după slug. Incrementarea numărului de vizualizări este o comandă
/// separată (IncrementArticleViewCountCommand), ca query-ul să rămână fără efecte laterale.
/// </summary>
public record GetArticleBySlugQuery(string Slug) : IRequest<ArticleDetailDto>;

public class GetArticleBySlugQueryValidator : AbstractValidator<GetArticleBySlugQuery>
{
    public GetArticleBySlugQueryValidator()
    {
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(200)
            .WithMessage("Slug-ul articolului este obligatoriu (maxim 200 de caractere).");
    }
}

public class GetArticleBySlugQueryHandler : IRequestHandler<GetArticleBySlugQuery, ArticleDetailDto>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;

    public GetArticleBySlugQueryHandler(IAppDbContext db, IDateTimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<ArticleDetailDto> Handle(GetArticleBySlugQuery request, CancellationToken cancellationToken)
    {
        var slug = request.Slug.Trim().ToLowerInvariant();
        var now = _clock.UtcNow;

        var article = await _db.Articles
            .AsNoTracking()
            .Where(a => a.Slug == slug
                        && a.Status == ArticleStatus.Published
                        && a.PublishedAt != null
                        && a.PublishedAt <= now)
            .Select(a => new ArticleDetailDto
            {
                Id = a.Id,
                Title = a.Title,
                Slug = a.Slug,
                Excerpt = a.Excerpt,
                ContentHtml = a.ContentHtml,
                CoverImageUrl = a.CoverImageUrl,
                CoverImageAlt = a.CoverImageAlt,
                CategoryId = a.CategoryId,
                CategoryName = a.Category != null ? a.Category.Name : null,
                CategorySlug = a.Category != null ? a.Category.Slug : null,
                PublishedAt = a.PublishedAt,
                UpdatedAt = a.UpdatedAt,
                MetaTitle = a.MetaTitle,
                MetaDescription = a.MetaDescription,
                ReadingMinutes = a.ReadingMinutes,
                ViewCount = a.ViewCount,
            })
            .FirstOrDefaultAsync(cancellationToken);

        // Ciornele și articolele programate în viitor sunt tratate ca inexistente public.
        return article ?? throw new NotFoundException(nameof(Article), slug);
    }
}
