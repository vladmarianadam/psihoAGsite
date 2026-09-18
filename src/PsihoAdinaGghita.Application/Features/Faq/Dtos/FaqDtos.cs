namespace PsihoAdinaGghita.Application.Features.Faq.Dtos;

/// <summary>Întrebare frecventă expusă public — doar cele active.</summary>
public record FaqItemDto(
    int Id,
    string Question,
    string AnswerHtml,
    int DisplayOrder);

/// <summary>Varianta pentru panoul de administrare, cu starea de activare și auditul.</summary>
public record AdminFaqItemDto(
    int Id,
    string Question,
    string AnswerHtml,
    int DisplayOrder,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
