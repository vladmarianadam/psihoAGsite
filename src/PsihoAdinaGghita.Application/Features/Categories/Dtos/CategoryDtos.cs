namespace PsihoAdinaGghita.Application.Features.Categories.Dtos;

/// <summary>Categorie expusă public — <c>ArticleCount</c> numără doar articolele publicate (plan §5).</summary>
public record CategoryDto(
    int Id,
    string Name,
    string Slug,
    string? Description,
    int DisplayOrder,
    int ArticleCount);

/// <summary>Categorie în panoul de management — <c>ArticleCount</c> include și draft-urile.</summary>
public record AdminCategoryDto(
    int Id,
    string Name,
    string Slug,
    string? Description,
    int DisplayOrder,
    int ArticleCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
