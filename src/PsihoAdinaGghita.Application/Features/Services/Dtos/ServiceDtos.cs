namespace PsihoAdinaGghita.Application.Features.Services.Dtos;

/// <summary>Serviciu în lista publică. <c>SessionMode</c> se serializează ca text ("Cabinet"/"Online"/"Both").</summary>
public record ServiceListItemDto(
    int Id,
    string Name,
    string Slug,
    string ShortDescription,
    decimal? Price,
    string? PriceUnit,
    int DurationMinutes,
    string? IconName,
    string? ImageUrl,
    string SessionMode,
    int DisplayOrder);

/// <summary>Detaliul public al unui serviciu, cu descrierea lungă (HTML sanitizat la salvare).</summary>
public record ServiceDetailDto(
    int Id,
    string Name,
    string Slug,
    string ShortDescription,
    string? LongDescriptionHtml,
    decimal? Price,
    string? PriceUnit,
    int DurationMinutes,
    string? IconName,
    string? ImageUrl,
    string SessionMode,
    int DisplayOrder);

/// <summary>Serviciu în panoul de management — toate câmpurile editabile, inclusiv cele inactive.</summary>
public record AdminServiceDto(
    int Id,
    string Name,
    string Slug,
    string ShortDescription,
    string? LongDescriptionHtml,
    decimal? Price,
    string? PriceUnit,
    int DurationMinutes,
    string? IconName,
    string? ImageUrl,
    string SessionMode,
    int DisplayOrder,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
