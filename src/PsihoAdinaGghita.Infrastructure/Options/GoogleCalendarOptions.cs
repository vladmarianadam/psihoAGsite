namespace PsihoAdinaGghita.Infrastructure.Options;

/// <summary>
/// Google Calendar prin cont de serviciu. Cheia JSON NU se comite — variabilă de mediu
/// (GoogleCalendar__ServiceAccountJson) sau fișier pe volumul /data (ServiceAccountJsonPath).
/// </summary>
public class GoogleCalendarOptions
{
    public const string SectionName = "GoogleCalendar";

    public bool Enabled { get; set; }

    /// <summary>Adresa Gmail a cabinetului sau id-ul unui calendar secundar, partajat cu contul de serviciu.</summary>
    public string CalendarId { get; set; } = string.Empty;

    public string ServiceAccountJson { get; set; } = string.Empty;
    public string ServiceAccountJsonPath { get; set; } = string.Empty;
}
