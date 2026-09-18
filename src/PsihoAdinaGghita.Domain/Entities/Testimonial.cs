using PsihoAdinaGghita.Domain.Common;

namespace PsihoAdinaGghita.Domain.Entities;

public class Testimonial : BaseEntity
{
    /// <summary>Inițiale, conform practicii de confidențialitate (ex. „D.R.").</summary>
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorRole { get; set; }
    public string Text { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public bool IsApproved { get; set; }
    public int DisplayOrder { get; set; }
}
