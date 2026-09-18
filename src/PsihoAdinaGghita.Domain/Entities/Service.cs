using PsihoAdinaGghita.Domain.Common;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Domain.Entities;

public class Service : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string? LongDescriptionHtml { get; set; }
    public decimal? Price { get; set; }
    public string? PriceUnit { get; set; }
    public int DurationMinutes { get; set; }
    public string? IconName { get; set; }
    public string? ImageUrl { get; set; }
    public SessionMode SessionMode { get; set; } = SessionMode.Both;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
