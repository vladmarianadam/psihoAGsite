using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Common.Models;
using PsihoAdinaGghita.Application.Features.Articles.Dtos;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Articles.Queries;

/// <summary>Listarea din panoul de administrare: include ciornele, ordonată după ultima modificare.</summary>
public record GetAdminArticlesQuery(
    int Page = 1,
    int PageSize = 20,
    string? Status = null,
    string? Q = null) : IRequest<PagedResult<AdminArticleListItemDto>>;

public class GetAdminArticlesQueryValidator : AbstractValidator<GetAdminArticlesQuery>
{
    public GetAdminArticlesQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1)
            .WithMessage("Pagina trebuie să fie cel puțin 1.");

        RuleFor(x => x.PageSize).InclusiveBetween(1, 50)
            .WithMessage("Dimensiunea paginii trebuie să fie între 1 și 50.");

        RuleFor(x => x.Status)
            .Must(status => string.IsNullOrWhiteSpace(status)
                            || Enum.TryParse<ArticleStatus>(status, ignoreCase: true, out _))
            .WithMessage("Statusul acceptă numai valorile \"Draft\" sau \"Published\".");
    }
}

public class GetAdminArticlesQueryHandler
    : IRequestHandler<GetAdminArticlesQuery, PagedResult<AdminArticleListItemDto>>
{
    private readonly IAppDbContext _db;

    public GetAdminArticlesQueryHandler(IAppDbContext db) => _db = db;

    public async Task<PagedResult<AdminArticleListItemDto>> Handle(
        GetAdminArticlesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _db.Articles.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Status)
            && Enum.TryParse<ArticleStatus>(request.Status, ignoreCase: true, out var status))
        {
            query = query.Where(a => a.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            var pattern = $"%{request.Q.Trim()}%";
            query = query.Where(a => EF.Functions.Like(a.Title, pattern)
                                     || EF.Functions.Like(a.Slug, pattern)
                                     || EF.Functions.Like(a.Excerpt, pattern));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Status e persistat ca text prin value converter, deci ToString() se face după
        // materializare (proiecția aduce oricum numai coloanele necesare).
        var rows = await query
            .OrderByDescending(a => a.UpdatedAt ?? a.CreatedAt)
            .ThenByDescending(a => a.Id)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Slug,
                CategoryName = a.Category != null ? a.Category.Name : null,
                a.Status,
                a.PublishedAt,
                a.ViewCount,
                a.ReadingMinutes,
                a.UpdatedAt,
                a.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        var items = rows
            .Select(r => new AdminArticleListItemDto
            {
                Id = r.Id,
                Title = r.Title,
                Slug = r.Slug,
                CategoryName = r.CategoryName,
                Status = r.Status.ToString(),
                PublishedAt = r.PublishedAt,
                ViewCount = r.ViewCount,
                ReadingMinutes = r.ReadingMinutes,
                UpdatedAt = r.UpdatedAt,
                CreatedAt = r.CreatedAt,
            })
            .ToList();

        return new PagedResult<AdminArticleListItemDto>(items, request.Page, request.PageSize, totalCount);
    }
}
