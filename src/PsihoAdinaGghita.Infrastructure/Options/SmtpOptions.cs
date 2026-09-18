namespace PsihoAdinaGghita.Infrastructure.Options;

public class SmtpOptions
{
    public const string SectionName = "Smtp";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseStartTls { get; set; } = true;
    public string Username { get; set; } = string.Empty;

    /// <summary>NU se comite în appsettings.json — User Secrets / variabile de mediu (plan §9.1).</summary>
    public string Password { get; set; } = string.Empty;

    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Cabinet Psihologic Adina Gghita";

    /// <summary>Destinatarul notificărilor (cereri de programare, mesaje de contact).</summary>
    public string ToAddress { get; set; } = string.Empty;

    /// <summary>Dacă e false, emailurile se loghează în loc să fie trimise (dev fără SMTP).</summary>
    public bool Enabled { get; set; }
}
