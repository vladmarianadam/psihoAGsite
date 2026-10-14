namespace PsihoAdinaGghita.Application.Common.Interfaces;

public record EmailAttachment(string FileName, string ContentType, byte[] Content);

/// <summary>
/// <paramref name="To"/> null = inboxul cabinetului (Smtp:ToAddress).
/// </summary>
public record EmailMessage(
    string? To,
    string Subject,
    string HtmlBody,
    string? ReplyTo = null,
    IReadOnlyList<EmailAttachment>? Attachments = null);

public interface IEmailSender
{
    /// <summary>
    /// Trimite un email HTML. Implementarea nu aruncă excepții pentru erori SMTP —
    /// întoarce false și loghează, ca o cădere de SMTP să nu piardă cererea salvată în DB.
    /// </summary>
    Task<bool> SendAsync(EmailMessage message, CancellationToken cancellationToken = default);

    /// <summary>Notificare către inboxul cabinetului.</summary>
    Task<bool> SendAsync(string subject, string htmlBody, string? replyTo = null, CancellationToken cancellationToken = default)
        => SendAsync(new EmailMessage(null, subject, htmlBody, replyTo), cancellationToken);
}
