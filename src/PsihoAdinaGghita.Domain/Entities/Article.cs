using PsihoAdinaGghita.Domain.Common;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Domain.Entities;

public class Article : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public string? CoverImageAlt { get; set; }
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    public ArticleStatus Status { get; set; } = ArticleStatus.Draft;
    public DateTime? PublishedAt { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public int ReadingMinutes { get; set; }
    public int ViewCount { get; set; }
}
