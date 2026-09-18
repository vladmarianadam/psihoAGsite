using PsihoAdinaGghita.Domain.Common;

namespace PsihoAdinaGghita.Domain.Entities;

public class FaqItem : BaseEntity
{
    public string Question { get; set; } = string.Empty;
    public string AnswerHtml { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
