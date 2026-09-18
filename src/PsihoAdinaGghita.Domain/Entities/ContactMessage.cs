using PsihoAdinaGghita.Domain.Common;

namespace PsihoAdinaGghita.Domain.Entities;

/// <summary>
/// Mesaj din formularul de contact. Ca și cererile de programare, se persistă
/// în DB pe lângă trimiterea pe email — dacă SMTP-ul cade, mesajul nu se pierde (plan §4).
/// </summary>
public class ContactMessage : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool GdprConsent { get; set; }
    public bool IsHandled { get; set; }
}
