namespace PsihoAdinaGghita.Application.Common.Interfaces;

public interface IEmailSender
{
    /// <summary>
    /// Trimite un email HTML. Implementarea nu aruncă excepții pentru erori SMTP —
    /// întoarce false și loghează, ca o cădere de SMTP să nu piardă cererea salvată în DB.
    /// </summary>
    Task<bool> SendAsync(string subject, string htmlBody, string? replyTo = null, CancellationToken cancellationToken = default);
}
