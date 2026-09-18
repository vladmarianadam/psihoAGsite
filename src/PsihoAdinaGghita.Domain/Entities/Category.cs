using PsihoAdinaGghita.Domain.Common;

namespace PsihoAdinaGghita.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }

    public ICollection<Article> Articles { get; set; } = new List<Article>();
}
