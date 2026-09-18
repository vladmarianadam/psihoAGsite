using System.Text;
using System.Text.Encodings.Web;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Appointments.Commands;

/// <summary>
/// Cerere de programare din formularul public. <paramref name="Honeypot"/> e un câmp
/// invizibil în formular: dacă vine completat, cererea e spam (plan §4).
/// </summary>
public record CreateAppointmentRequestCommand(
    string FullName,
    string Email,
    string Phone,
    int? ServiceId,
    string PreferredMode,
    string? PreferredTimeframe,
    string? Message,
    bool GdprConsent,
    string? Honeypot) : IRequest<int>;

public class CreateAppointmentRequestCommandValidator : AbstractValidator<CreateAppointmentRequestCommand>
{
    /// <summary>Cifre, spații, plus, paranteze și cratime — formatele uzuale de telefon.</summary>
    private const string PhonePattern = @"^[0-9+()\-\s]+$";

    private readonly IAppDbContext _db;

    public CreateAppointmentRequestCommandValidator(IAppDbContext db)
    {
        _db = db;

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Numele este obligatoriu.")
            .MinimumLength(2).WithMessage("Numele trebuie să aibă cel puțin 2 caractere.")
            .MaximumLength(150).WithMessage("Numele poate avea maxim 150 de caractere.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Adresa de email este obligatorie.")
            .EmailAddress().WithMessage("Adresa de email nu este validă.")
            .MaximumLength(200).WithMessage("Adresa de email poate avea maxim 200 de caractere.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Numărul de telefon este obligatoriu.")
            .MinimumLength(7).WithMessage("Numărul de telefon trebuie să aibă cel puțin 7 caractere.")
            .MaximumLength(40).WithMessage("Numărul de telefon poate avea maxim 40 de caractere.")
            .Matches(PhonePattern)
            .WithMessage("Numărul de telefon poate conține doar cifre, spații și caracterele + ( ) -.");

        RuleFor(x => x.PreferredMode)
            .NotEmpty().WithMessage("Modul preferat de ședință este obligatoriu.")
            .Must(BeAValidSessionMode)
            .WithMessage("Modul preferat de ședință trebuie să fie Cabinet, Online sau Both.");

        RuleFor(x => x.PreferredTimeframe)
            .MaximumLength(200).WithMessage("Intervalul preferat poate avea maxim 200 de caractere.");

        RuleFor(x => x.Message)
            .MaximumLength(2000).WithMessage("Mesajul poate avea maxim 2000 de caractere.");

        RuleFor(x => x.GdprConsent)
            .Equal(true)
            .WithMessage("Este necesar consimtamantul pentru prelucrarea datelor personale.");

        RuleFor(x => x.ServiceId)
            .MustAsync(ServiceExistsAndIsActive)
            .WithMessage("Serviciul selectat nu există sau nu este disponibil.")
            .When(x => x.ServiceId.HasValue);
    }

    /// <summary>Parsare tolerantă la majuscule, dar fără a accepta valori numerice.</summary>
    private static bool BeAValidSessionMode(string? mode) =>
        mode is not null && Enum.GetNames<SessionMode>()
            .Any(name => string.Equals(name, mode.Trim(), StringComparison.OrdinalIgnoreCase));

    private async Task<bool> ServiceExistsAndIsActive(int? serviceId, CancellationToken cancellationToken) =>
        await _db.Services.AsNoTracking()
            .AnyAsync(s => s.Id == serviceId!.Value && s.IsActive, cancellationToken);
}

public class CreateAppointmentRequestCommandHandler : IRequestHandler<CreateAppointmentRequestCommand, int>
{
    private readonly IAppDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<CreateAppointmentRequestCommandHandler> _logger;

    public CreateAppointmentRequestCommandHandler(
        IAppDbContext db,
        IEmailSender emailSender,
        ILogger<CreateAppointmentRequestCommandHandler> logger)
    {
        _db = db;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task<int> Handle(CreateAppointmentRequestCommand request, CancellationToken cancellationToken)
    {
        // Honeypot completat → bot. Nu salvăm, nu trimitem email, dar răspundem
        // ca la un succes, ca botul să nu afle că a fost filtrat (plan §4).
        if (!string.IsNullOrWhiteSpace(request.Honeypot))
        {
            _logger.LogInformation("Cerere de programare respinsă ca spam (honeypot completat).");
            return 0;
        }

        var entity = new AppointmentRequest
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            ServiceId = request.ServiceId,
            PreferredMode = Enum.Parse<SessionMode>(request.PreferredMode.Trim(), ignoreCase: true),
            PreferredTimeframe = Normalize(request.PreferredTimeframe),
            Message = Normalize(request.Message),
            GdprConsent = request.GdprConsent,
            IsHandled = false,
        };

        _db.AppointmentRequests.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        var serviceName = entity.ServiceId is null
            ? null
            : await _db.Services.AsNoTracking()
                .Where(s => s.Id == entity.ServiceId.Value)
                .Select(s => s.Name)
                .FirstOrDefaultAsync(cancellationToken);

        var sent = await _emailSender.SendAsync(
            $"Cerere de programare - {SingleLine(entity.FullName)}",
            BuildHtmlBody(entity, serviceName),
            entity.Email,
            cancellationToken);

        // Cererea e deja în DB — o cădere de SMTP nu trebuie să întoarcă eroare clientului (plan §4).
        if (!sent)
        {
            _logger.LogWarning(
                "Emailul pentru cererea de programare {AppointmentRequestId} nu a putut fi trimis; cererea rămâne salvată în baza de date.",
                entity.Id);
        }

        return entity.Id;
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    /// <summary>Elimină CR/LF ca subiectul emailului să nu poată fi folosit pentru header injection.</summary>
    private static string SingleLine(string value) =>
        value.Replace('\r', ' ').Replace('\n', ' ').Trim();

    /// <summary>
    /// Corpul emailului se compune în Application, ca Infrastructure să rămână doar transport (plan §4).
    /// Fiecare valoare venită din formular e encodată HTML înainte de a intra în tabel (plan §7).
    /// </summary>
    private static string BuildHtmlBody(AppointmentRequest entity, string? serviceName)
    {
        var encoder = HtmlEncoder.Default;
        var sb = new StringBuilder();

        sb.Append("<div style=\"font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222\">");
        sb.Append("<h2 style=\"margin:0 0 12px\">Cerere de programare nouă</h2>");
        sb.Append("<table cellpadding=\"8\" cellspacing=\"0\" style=\"border-collapse:collapse;border:1px solid #ddd\">");

        AppendRow(sb, "Nume", encoder.Encode(entity.FullName));
        AppendRow(sb, "Email", encoder.Encode(entity.Email));
        AppendRow(sb, "Telefon", encoder.Encode(entity.Phone));
        AppendRow(sb, "Serviciu", string.IsNullOrWhiteSpace(serviceName) ? "(neprecizat)" : encoder.Encode(serviceName));
        AppendRow(sb, "Mod ședință", encoder.Encode(entity.PreferredMode.ToString()));
        AppendRow(sb, "Interval preferat", string.IsNullOrWhiteSpace(entity.PreferredTimeframe)
            ? "(neprecizat)"
            : encoder.Encode(entity.PreferredTimeframe));
        AppendRow(sb, "Mesaj", string.IsNullOrWhiteSpace(entity.Message)
            ? "(fără mesaj)"
            : encoder.Encode(entity.Message).Replace("\n", "<br />"));
        AppendRow(sb, "Consimțământ GDPR", entity.GdprConsent ? "Da" : "Nu");
        AppendRow(sb, "Primită la (UTC)", entity.CreatedAt.ToString("dd.MM.yyyy HH:mm"));

        sb.Append("</table>");
        sb.Append("<p style=\"margin:12px 0 0;color:#666\">Poți răspunde direct la acest email pentru a contacta solicitantul.</p>");
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
