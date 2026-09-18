using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Helpers;
using PsihoAdinaGghita.Application.Common.Interfaces;

namespace PsihoAdinaGghita.Application.Features.Articles;

/// <summary>
/// Regula de slug pentru articole, comună între Create și Update (plan §7):
/// slug gol → generat din titlu, cu sufix numeric la coliziune; slug dat explicit
/// și deja folosit → <see cref="ConflictException"/>.
/// </summary>
internal static class ArticleSlugResolver
{
    private const string Fallback = "articol";

    public static async Task<string> ResolveAsync(
        IAppDbContext db,
        string? requestedSlug,
        string title,
        int? currentArticleId,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(requestedSlug))
        {
            var explicitSlug = requestedSlug.Trim().ToLowerInvariant();
            if (await IsTakenAsync(db, explicitSlug, currentArticleId, cancellationToken))
            {
                throw new ConflictException(
                    $"Slug-ul \"{explicitSlug}\" este deja folosit de un alt articol. Alege altul.");
            }

            return explicitSlug;
        }

        var baseSlug = SlugHelper.Generate(title);
        if (string.IsNullOrEmpty(baseSlug))
            baseSlug = Fallback;

        var candidate = baseSlug;
        var suffix = 2;
        while (await IsTakenAsync(db, candidate, currentArticleId, cancellationToken))
        {
            candidate = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return candidate;
    }

    private static Task<bool> IsTakenAsync(
        IAppDbContext db,
        string slug,
        int? currentArticleId,
        CancellationToken cancellationToken) =>
        db.Articles
            .AsNoTracking()
            .AnyAsync(a => a.Slug == slug && (currentArticleId == null || a.Id != currentArticleId), cancellationToken);
}
