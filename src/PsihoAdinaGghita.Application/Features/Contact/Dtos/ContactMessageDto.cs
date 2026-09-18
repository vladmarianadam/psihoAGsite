namespace PsihoAdinaGghita.Application.Features.Contact.Dtos;

/// <summary>
/// Mesaj din formularul de contact, așa cum e afișat în panoul de management (plan §4).
/// Conține date personale — nu se loghează niciodată (plan §10).
/// </summary>
public record ContactMessageDto(
    int Id,
    string FullName,
    string Email,
    string? Phone,
    string Subject,
    string Message,
    bool IsHandled,
    DateTime CreatedAt);
