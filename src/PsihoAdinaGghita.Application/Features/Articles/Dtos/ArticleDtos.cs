namespace PsihoAdinaGghita.Application.Features.Articles.Dtos;

/// <summary>Card de articol pentru listarea publică din blog (plan §7).</summary>
public record ArticleListItemDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string Excerpt { get; init; } = string.Empty;
    public string? CoverImageUrl { get; init; }
    public string? CoverImageAlt { get; init; }
    public string? CategoryName { get; init; }
    public string? CategorySlug { get; init; }
    public DateTime? PublishedAt { get; init; }
    public int ReadingMinutes { get; init; }
}

/// <summary>Articolul complet, pentru pagina publică de detaliu.</summary>
public record ArticleDetailDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string Excerpt { get; init; } = string.Empty;
    public string ContentHtml { get; init; } = string.Empty;
    public string? CoverImageUrl { get; init; }
    public string? CoverImageAlt { get; init; }
    public int? CategoryId { get; init; }
    public string? CategoryName { get; init; }
    public string? CategorySlug { get; init; }
    public DateTime? PublishedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public string? MetaTitle { get; init; }
    public string? MetaDescription { get; init; }
    public int ReadingMinutes { get; init; }
    public int ViewCount { get; init; }
}

/// <summary>Rând din tabelul de administrare (include ciornele).</summary>
public record AdminArticleListItemDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string? CategoryName { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime? PublishedAt { get; init; }
    public int ViewCount { get; init; }
    public int ReadingMinutes { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>Toate câmpurile editabile din formularul de administrare.</summary>
public record AdminArticleDetailDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string Excerpt { get; init; } = string.Empty;
    public string ContentHtml { get; init; } = string.Empty;
    public string? CoverImageUrl { get; init; }
    public string? CoverImageAlt { get; init; }
    public int? CategoryId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime? PublishedAt { get; init; }
    public string? MetaTitle { get; init; }
    public string? MetaDescription { get; init; }
    public int ReadingMinutes { get; init; }
    public int ViewCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
