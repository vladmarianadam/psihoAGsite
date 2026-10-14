using System.Globalization;
using System.Text;

namespace PsihoAdinaGghita.Application.Features.Booking.Services;

/// <summary>
/// Fișierul invite.ics atașat la emailul de confirmare. Clientul nu e invitat din Google
/// (contul de serviciu nu poate trimite invitații), deci primește evenimentul ca fișier.
/// </summary>
public static class IcsBuilder
{
    public const string ContentType = "text/calendar; method=PUBLISH; charset=utf-8";

    // shortcut: liniile nu se pliază la 75 de octeți (RFC 5545 §3.1); clienții uzuali le acceptă așa.
    public static string Build(int appointmentId, string summary, string description, DateTime startUtc, DateTime endUtc, DateTime nowUtc)
    {
        var sb = new StringBuilder();
        void Line(string value) => sb.Append(value).Append("\r\n");

        Line("BEGIN:VCALENDAR");
        Line("VERSION:2.0");
        Line("PRODID:-//Cabinet Psihologic Adina Gghita//Programari//RO");
        Line("METHOD:PUBLISH");
        Line("BEGIN:VEVENT");
        Line($"UID:appointment-{appointmentId}@adinagghita.ro");
        Line($"DTSTAMP:{Format(nowUtc)}");
        Line($"DTSTART:{Format(startUtc)}");
        Line($"DTEND:{Format(endUtc)}");
        Line($"SUMMARY:{Escape(summary)}");
        Line($"DESCRIPTION:{Escape(description)}");
        Line("END:VEVENT");
        Line("END:VCALENDAR");

        return sb.ToString();
    }

    private static string Format(DateTime utc) =>
        utc.ToString("yyyyMMdd'T'HHmmss'Z'", CultureInfo.InvariantCulture);

    /// <summary>Escape pentru TEXT (RFC 5545 §3.3.11): \ ; , și liniile noi.</summary>
    public static string Escape(string value) => value
        .Replace("\\", "\\\\")
        .Replace(";", "\\;")
        .Replace(",", "\\,")
        .Replace("\r\n", "\\n")
        .Replace("\n", "\\n")
        .Replace("\r", "\\n");
}
