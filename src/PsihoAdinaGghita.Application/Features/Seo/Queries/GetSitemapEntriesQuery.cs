using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Seo.Dtos;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Seo.Queries;

public record GetSitemapEntriesQuery : IRequest<IReadOnlyList<SitemapEntryDto>>;

public class GetSitemapEntriesQueryHandler : IRequestHandler<GetSitemapEntriesQuery, IReadOnlyList<SitemapEntryDto>>
{
    /// <summary>
    /// Paginile statice ale site-ului public. Zona de administrare (/management)
    /// nu apare niciodată în sitemap și este blocată în robots.txt (plan §7).
    /// </summary>
    private static readonly (string RelativeUrl, string ChangeFrequency, decimal Priority)[] StaticPages =
    [
        ("/", "weekly", 1.0m),
        ("/despre", "monthly", 0.8m),
        ("/servicii", "monthly", 0.9m),
        ("/blog", "weekly", 0.8m),
        ("/contact", "yearly", 0.7m),
        ("/termeni-si-conditii", "yearly", 0.3m),
        ("/politica-de-confidentialitate", "yearly", 0.3m),
        ("/politica-de-cookies", "yearly", 0.3m),
    ];

    private readonly IAppDbContext _db;
    public GetSitemapEntriesQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<SitemapEntryDto>> Handle(GetSitemapEntriesQuery request, CancellationToken cancellationToken)
    {
        var services = await _db.Services
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.DisplayOrder)
            .ThenBy(s => s.Name)
            .Select(s => new { s.Slug, s.UpdatedAt, s.CreatedAt })
            .ToListAsync(cancellationToken);

        // Doar categoriile care au cel puțin un articol publicat — o pagină de
        // categorie goală n-are ce indexa.
        var categories = await _db.Categories
            .AsNoTracking()
            .Where(c => c.Articles.Any(a => a.Status == ArticleStatus.Published))
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new { c.Slug })
            .ToListAsync(cancellationToken);

        var articles = await _db.Articles
            .AsNoTracking()
            .Where(a => a.Status == ArticleStatus.Published)
            .OrderByDescending(a => a.PublishedAt)
            .ThenByDescending(a => a.Id)
            .Select(a => new { a.Slug, a.UpdatedAt, a.PublishedAt })
            .ToListAsync(cancellationToken);

        var entries = new List<SitemapEntryDto>(
            StaticPages.Length + services.Count + categories.Count + articles.Count);

        foreach (var page in StaticPages)
            entries.Add(new SitemapEntryDto(page.RelativeUrl, null, page.ChangeFrequency, page.Priority));

        foreach (var service in services)
            entries.Add(new SitemapEntryDto($"/servicii/{service.Slug}", service.UpdatedAt ?? service.CreatedAt, "monthly", 0.8m));

        foreach (var category in categories)
            entries.Add(new SitemapEntryDto($"/blog/categorie/{category.Slug}", null, "weekly", 0.6m));

        foreach (var article in articles)
            entries.Add(new SitemapEntryDto($"/blog/{article.Slug}", article.UpdatedAt ?? article.PublishedAt, "monthly", 0.7m));

        return entries;
    }
}
