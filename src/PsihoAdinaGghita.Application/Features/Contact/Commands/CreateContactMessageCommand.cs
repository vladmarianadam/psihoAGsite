using System.Text;
using System.Text.Encodings.Web;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Contact.Commands;

/// <summary>
/// Mesaj din formularul public de contact. <paramref name="Honeypot"/> e un câmp
/// invizibil în formular: dacă vine completat, mesajul e spam (plan §4).
/// </summary>
public record CreateContactMessageCommand(
    string FullName,
    string Email,
    string? Phone,
    string Subject,
    string Message,
    bool GdprConsent,
    string? Honeypot) : IRequest<int>;

public class CreateContactMessageCommandValidator : AbstractValidator<CreateContactMessageCommand>
{
    /// <summary>Cifre, spații, plus, paranteze și cratime — formatele uzuale de telefon.</summary>
    private const string PhonePattern = @"^[0-9+()\-\s]+$";

    public CreateContactMessageCommandValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Numele este obligatoriu.")
            .MinimumLength(2).WithMessage("Numele trebuie să aibă cel puțin 2 caractere.")
            .MaximumLength(150).WithMessage("Numele poate avea maxim 150 de caractere.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Adresa de email este obligatorie.")
            .EmailAddress().WithMessage("Adresa de email nu este validă.")
            .MaximumLength(200).WithMessage("Adresa de email poate avea maxim 200 de caractere.");

        // Telefonul e opțional aici, dar dacă e trimis trebuie să fie plauzibil.
        RuleFor(x => x.Phone)
            .MinimumLength(7).WithMessage("Numărul de telefon trebuie să aibă cel puțin 7 caractere.")
            .MaximumLength(40).WithMessage("Numărul de telefon poate avea maxim 40 de caractere.")
            .Matches(PhonePattern)
            .WithMessage("Numărul de telefon poate conține doar cifre, spații și caracterele + ( ) -.")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone));

        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("Subiectul este obligatoriu.")
            .MaximumLength(200).WithMessage("Subiectul poate avea maxim 200 de caractere.");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Mesajul este obligatoriu.")
            .MinimumLength(10).WithMessage("Mesajul trebuie să aibă cel puțin 10 caractere.")
            .MaximumLength(2000).WithMessage("Mesajul poate avea maxim 2000 de caractere.");

        RuleFor(x => x.GdprConsent)
            .Equal(true)
            .WithMessage("Este necesar consimtamantul pentru prelucrarea datelor personale.");
    }
}

public class CreateContactMessageCommandHandler : IRequestHandler<CreateContactMessageCommand, int>
{
    private readonly IAppDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<CreateContactMessageCommandHandler> _logger;

    public CreateContactMessageCommandHandler(
        IAppDbContext db,
        IEmailSender emailSender,
        ILogger<CreateContactMessageCommandHandler> logger)
    {
        _db = db;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task<int> Handle(CreateContactMessageCommand request, CancellationToken cancellationToken)
    {
        // Honeypot completat → bot. Nu salvăm, nu trimitem email, dar răspundem
        // ca la un succes, ca botul să nu afle că a fost filtrat (plan §4).
        if (!string.IsNullOrWhiteSpace(request.Honeypot))
        {
            _logger.LogInformation("Mesaj de contact respins ca spam (honeypot completat).");
            return 0;
        }

        var entity = new ContactMessage
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            Subject = request.Subject.Trim(),
            Message = request.Message.Trim(),
            GdprConsent = request.GdprConsent,
            IsHandled = false,
        };

        _db.ContactMessages.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        var sent = await _emailSender.SendAsync(
            $"Mesaj de contact - {SingleLine(entity.Subject)}",
            BuildHtmlBody(entity),
            entity.Email,
            cancellationToken);

        // Mesajul e deja în DB — o cădere de SMTP nu trebuie să întoarcă eroare clientului (plan §4).
        if (!sent)
        {
            _logger.LogWarning(
                "Emailul pentru mesajul de contact {ContactMessageId} nu a putut fi trimis; mesajul rămâne salvat în baza de date.",
                entity.Id);
        }

        return entity.Id;
    }

    /// <summary>Elimină CR/LF ca subiectul emailului să nu poată fi folosit pentru header injection.</summary>
    private static string SingleLine(string value) =>
        value.Replace('\r', ' ').Replace('\n', ' ').Trim();

    /// <summary>
    /// Corpul emailului se compune în Application, ca Infrastructure să rămână doar transport (plan §4).
    /// Fiecare valoare venită din formular e encodată HTML înainte de a intra în tabel (plan §7).
    /// </summary>
    private static string BuildHtmlBody(ContactMessage entity)
    {
        var encoder = HtmlEncoder.Default;
        var sb = new StringBuilder();

        sb.Append("<div style=\"font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222\">");
        sb.Append("<h2 style=\"margin:0 0 12px\">Mesaj nou din formularul de contact</h2>");
        sb.Append("<table cellpadding=\"8\" cellspacing=\"0\" style=\"border-collapse:collapse;border:1px solid #ddd\">");

        AppendRow(sb, "Nume", encoder.Encode(entity.FullName));
        AppendRow(sb, "Email", encoder.Encode(entity.Email));
        AppendRow(sb, "Telefon", string.IsNullOrWhiteSpace(entity.Phone) ? "(neprecizat)" : encoder.Encode(entity.Phone));
        AppendRow(sb, "Subiect", encoder.Encode(entity.Subject));
        AppendRow(sb, "Mesaj", encoder.Encode(entity.Message).Replace("\n", "<br />"));
        AppendRow(sb, "Consimțământ GDPR", entity.GdprConsent ? "Da" : "Nu");
        AppendRow(sb, "Primit la (UTC)", entity.CreatedAt.ToString("dd.MM.yyyy HH:mm"));

        sb.Append("</table>");
        sb.Append("<p style=\"margin:12px 0 0;color:#666\">Poți răspunde direct la acest email pentru a contacta expeditorul.</p>");
        sb.Append("</div>");

        return sb.ToString();
    }

    private static void AppendRow(StringBuilder sb, string label, string value)
    {
        sb.Append("<tr>");
        sb.Append("<th align=\"left\" style=\"border:1px solid #ddd;background:#f7f7f7;white-space:nowrap\">");
        sb.Append(label);
        sb.Append("</th><td style=\"border:1px solid #ddd\">");
        sb.Append(value);
        sb.Append("</td></tr>");
    }
}
