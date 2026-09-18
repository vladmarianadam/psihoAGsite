namespace PsihoAdinaGghita.Application.Features.Seo.Dtos;

/// <summary>
/// O intrare de sitemap. <paramref name="RelativeUrl"/> începe întotdeauna cu „/” —
/// baza publică se adaugă în controller din configurația „Site:PublicUrl” (plan §11).
/// </summary>
public record SitemapEntryDto(
    string RelativeUrl,
    DateTime? LastModified,
    string ChangeFrequency,
    decimal Priority);
