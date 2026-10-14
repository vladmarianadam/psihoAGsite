using System.Globalization;
using System.Text;
using System.Text.Encodings.Web;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Booking.Services;

/// <summary>
/// Emailurile programărilor pe slot. Corpul se compune în Application, ca Infrastructure să
/// rămână doar transport; orice valoare venită de la client e encodată HTML.
/// </summary>
public static class BookingEmails
{
    private static readonly TimeZoneInfo RomaniaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Bucharest");
    private static readonly HtmlEncoder Encoder = HtmlEncoder.Default;

    /// <summary>Ora slotului în ora României, „dd.MM.yyyy HH:mm”.</summary>
    public static string FormatLocal(DateTime? utc) => utc is null
        ? "(fără oră)"
        : TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc.Value, DateTimeKind.Utc), RomaniaTimeZone)
            .ToString("dd.MM.yyyy HH:mm", CultureInfo.InvariantCulture);

    public static EmailMessage NewBookingForPractice(AppointmentRequest a, string? serviceName) => new(
        null,
        $"Programare nouă #{a.Id} - {FormatLocal(a.StartAt)}",
        Wrap("Programare nouă, în așteptarea confirmării",
            Table(
                ("Nume", Encoder.Encode(a.FullName)),
                ("Email", Encoder.Encode(a.Email)),
                ("Telefon", Encoder.Encode(a.Phone)),
                ("Serviciu", Encoder.Encode(serviceName ?? "(neprecizat)")),
                ("Mod ședință", Encoder.Encode(a.PreferredMode.ToString())),
                ("Data și ora", FormatLocal(a.StartAt)),
                ("Mesaj", string.IsNullOrWhiteSpace(a.Message) ? "(fără mesaj)" : Encoder.Encode(a.Message).Replace("\n", "<br />"))),
            "Confirmă sau respinge programarea din panoul de management. Poți răspunde direct la acest email pentru a contacta solicitantul."),
        a.Email);

    public static EmailMessage NewBookingForClient(AppointmentRequest a, string? serviceName) => new(
        a.Email,
        "Cererea ta de programare a fost trimisă",
        Wrap("Cererea ta a fost trimisă",
            Table(Details(a, serviceName)),
            "Cererea ta a fost trimisă. Primești confirmarea pe email după ce este aprobată."));

    public static EmailMessage ConfirmedForClient(AppointmentRequest a, string? serviceName, DateTime nowUtc)
    {
        var ics = IcsBuilder.Build(
            a.Id,
            $"Ședință - {serviceName ?? "Cabinet Psihologic Adina Gghita"}",
            $"Mod: {a.PreferredMode}. Cabinet Psihologic Adina Gghita.",
            a.StartAt!.Value,
            a.EndAt!.Value,
            nowUtc);

        return new EmailMessage(
            a.Email,
            $"Programarea ta a fost confirmată - {FormatLocal(a.StartAt)}",
            Wrap("Programarea ta a fost confirmată",
                Table(Details(a, serviceName)),
                "Te așteptăm! Ai atașat fișierul invite.ics, pe care îl poți adăuga în calendar. Dacă nu mai poți ajunge, răspunde la acest email."),
            Attachments: [new EmailAttachment("invite.ics", IcsBuilder.ContentType, Encoding.UTF8.GetBytes(ics))]);
    }

    public static EmailMessage ConfirmedCopyForPractice(AppointmentRequest a, string? serviceName) => new(
        null,
        $"Programare confirmată #{a.Id} - {FormatLocal(a.StartAt)}",
        Wrap("Programare confirmată",
            Table([("Nume", Encoder.Encode(a.FullName)), ("Email", Encoder.Encode(a.Email)), ("Telefon", Encoder.Encode(a.Phone)), .. Details(a, serviceName)]),
            "Clientul a primit confirmarea pe email, cu fișierul invite.ics."),
        a.Email);

    public static EmailMessage RejectedForClient(AppointmentRequest a, string? serviceName) => new(
        a.Email,
        "Cererea ta de programare nu a putut fi confirmată",
        Wrap("Cererea ta nu a putut fi confirmată",
            Table([.. Details(a, serviceName), .. Reason(a)]),
            "Îți mulțumim pentru înțelegere. Poți alege oricând alt interval de pe site."));

    public static EmailMessage CancelledForClient(AppointmentRequest a, string? serviceName) => new(
        a.Email,
        "Programarea ta a fost anulată",
        Wrap("Programarea ta a fost anulată",
            Table([.. Details(a, serviceName), .. Reason(a)]),
            "Ne pare rău pentru neplăcere. Poți alege oricând alt interval de pe site."));

    private static (string, string)[] Details(AppointmentRequest a, string? serviceName) =>
    [
        ("Serviciu", Encoder.Encode(serviceName ?? "(neprecizat)")),
        ("Mod ședință", Encoder.Encode(a.PreferredMode.ToString())),
        ("Data și ora", FormatLocal(a.StartAt)),
    ];

    private static (string, string)[] Reason(AppointmentRequest a) => string.IsNullOrWhiteSpace(a.RejectReason)
        ? []
        : [("Motiv", Encoder.Encode(a.RejectReason).Replace("\n", "<br />"))];

    private static string Wrap(string title, string table, string footer) =>
        "<div style=\"font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222\">"
        + $"<h2 style=\"margin:0 0 12px\">{title}</h2>"
        + table
        + $"<p style=\"margin:12px 0 0;color:#666\">{footer}</p>"
        + "</div>";

    /// <summary>Valorile primite trebuie să fie deja encodate HTML.</summary>
    private static string Table(params (string Label, string Value)[] rows)
    {
        var sb = new StringBuilder("<table cellpadding=\"8\" cellspacing=\"0\" style=\"border-collapse:collapse;border:1px solid #ddd\">");
        foreach (var (label, value) in rows)
        {
            sb.Append("<tr><th align=\"left\" style=\"border:1px solid #ddd;background:#f7f7f7;white-space:nowrap\">")
              .Append(label)
              .Append("</th><td style=\"border:1px solid #ddd\">")
              .Append(value)
              .Append("</td></tr>");
        }
        return sb.Append("</table>").ToString();
    }
}
