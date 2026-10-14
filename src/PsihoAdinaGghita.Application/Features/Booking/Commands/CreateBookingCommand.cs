using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Booking.Services;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Booking.Commands;

/// <summary>
/// Programare pe un slot ales din /programare; rămâne Pending până la confirmarea din panou.
/// <paramref name="StartAt"/> e exact StartAt-ul slotului primit (UTC). <paramref name="Honeypot"/> = câmp-capcană.
/// </summary>
public record CreateBookingCommand(
    int ServiceId,
    DateTime StartAt,
    string Mode,
    string FullName,
    string Email,
    string Phone,
    string? Message,
    bool GdprConsent,
    string? Honeypot) : IRequest<int>;

public class CreateBookingCommandValidator : AbstractValidator<CreateBookingCommand>
{
    /// <summary>Cifre, spații, plus, paranteze și cratime — formatele uzuale de telefon.</summary>
    private const string PhonePattern = @"^[0-9+()\-\s]+$";

    private readonly IAppDbContext _db;

    public CreateBookingCommandValidator(IAppDbContext db)
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

        RuleFor(x => x.Message)
            .MaximumLength(2000).WithMessage("Mesajul poate avea maxim 2000 de caractere.");

        RuleFor(x => x.GdprConsent)
            .Equal(true)
            .WithMessage("Este necesar consimtamantul pentru prelucrarea datelor personale.");

        RuleFor(x => x.StartAt)
            .NotEqual(default(DateTime)).WithMessage("Ora programării este obligatorie.");

        RuleFor(x => x.Mode)
            .Must(mode => ParseMode(mode) is not null)
            .WithMessage("Modul ședinței trebuie să fie Cabinet sau Online.");

        RuleFor(x => x.ServiceId)
            .GreaterThan(0).WithMessage("Serviciul este obligatoriu.")
            .MustAsync(ServiceIsBookable).WithMessage("Serviciul selectat nu există sau nu este disponibil.");

        RuleFor(x => x)
            .MustAsync(ModeIsOfferedByService)
            .WithName(nameof(CreateBookingCommand.Mode))
            .WithMessage("Serviciul selectat nu se oferă în modul ales.")
            .When(x => x.ServiceId > 0 && ParseMode(x.Mode) is not null);
    }

    /// <summary>Doar Cabinet sau Online — „Both” nu e un mod valid pentru o ședință concretă.</summary>
    public static SessionMode? ParseMode(string? mode) => mode?.Trim().ToLowerInvariant() switch
    {
        "cabinet" => SessionMode.Cabinet,
        "online" => SessionMode.Online,
        _ => null,
    };

    private async Task<bool> ServiceIsBookable(int serviceId, CancellationToken cancellationToken) =>
        await _db.Services.AsNoTracking()
            .AnyAsync(s => s.Id == serviceId && s.IsActive && s.DurationMinutes > 0, cancellationToken);

    private async Task<bool> ModeIsOfferedByService(CreateBookingCommand command, CancellationToken cancellationToken)
    {
        var mode = ParseMode(command.Mode)!.Value;
        var serviceMode = await _db.Services.AsNoTracking()
            .Where(s => s.Id == command.ServiceId)
            .Select(s => (SessionMode?)s.SessionMode)
            .FirstOrDefaultAsync(cancellationToken);

        // Serviciu inexistent → eroarea vine din regula pe ServiceId.
        return serviceMode is null || serviceMode == SessionMode.Both || serviceMode == mode;
    }
}

public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, int>
{
    private const string SlotTakenMessage = "Intervalul ales nu mai este disponibil. Te rugăm să alegi altă oră.";

    private readonly IAppDbContext _db;
    private readonly ICalendarService _calendar;
    private readonly IEmailSender _emailSender;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<CreateBookingCommandHandler> _logger;

    public CreateBookingCommandHandler(
        IAppDbContext db,
        ICalendarService calendar,
        IEmailSender emailSender,
        IDateTimeProvider clock,
        ILogger<CreateBookingCommandHandler> logger)
    {
        _db = db;
        _calendar = calendar;
        _emailSender = emailSender;
        _clock = clock;
        _logger = logger;
    }

    public async Task<int> Handle(CreateBookingCommand request, CancellationToken cancellationToken)
    {
        // Honeypot completat → bot: răspuns de succes fără salvare și fără email.
        if (!string.IsNullOrWhiteSpace(request.Honeypot))
        {
            _logger.LogInformation("Programare respinsă ca spam (honeypot completat).");
            return 0;
        }

        var settings = await _db.BookingSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        if (settings is null || !settings.IsEnabled)
            throw new ConflictException("Programările online sunt momentan suspendate. Te rugăm să ne contactezi telefonic sau prin formularul de contact.");

        var email = request.Email.Trim();
        var emailLower = email.ToLowerInvariant();
        var pending = await _db.AppointmentRequests.AsNoTracking()
            .CountAsync(a => a.Status == AppointmentStatus.Pending && a.Email.ToLower() == emailLower, cancellationToken);
        if (pending >= settings.MaxPendingPerEmail)
            throw new ConflictException("Ai deja cereri de programare în așteptare. Te rugăm să aștepți confirmarea lor înainte de a trimite alta.");

        var service = await _db.Services.AsNoTracking()
            .FirstAsync(s => s.Id == request.ServiceId, cancellationToken);

        var startUtc = request.StartAt.Kind == DateTimeKind.Local
            ? request.StartAt.ToUniversalTime()
            : DateTime.SpecifyKind(request.StartAt, DateTimeKind.Utc);

        // Slotul se verifică din nou: între afișare și trimitere poate fi ocupat sau poate fi expirat.
        var now = _clock.UtcNow;
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(settings.TimeZone);
        var localDate = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(startUtc, timeZone));
        var slots = await BookingAvailability.GetSlotsAsync(
            _db, _calendar, settings, service.DurationMinutes, localDate, localDate, now, cancellationToken);
        var slot = slots.FirstOrDefault(s => s.StartUtc == startUtc)
            ?? throw new ConflictException(SlotTakenMessage);

        var entity = new AppointmentRequest
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Phone = request.Phone.Trim(),
            ServiceId = service.Id,
            PreferredMode = CreateBookingCommandValidator.ParseMode(request.Mode)!.Value,
            Message = string.IsNullOrWhiteSpace(request.Message) ? null : request.Message.Trim(),
            GdprConsent = request.GdprConsent,
            Status = AppointmentStatus.Pending,
            StartAt = slot.StartUtc,
            EndAt = slot.EndUtc,
        };

        _db.AppointmentRequests.Add(entity);
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Indexul unic filtrat pe StartAt a prins o cursă între doi clienți.
            throw new ConflictException(SlotTakenMessage);
        }

        _logger.LogInformation("Programarea {AppointmentRequestId} a fost creată (Pending).", entity.Id);

        // După SaveChanges: o cădere de SMTP nu pierde programarea și nu întoarce eroare.
        await _emailSender.SendAsync(BookingEmails.NewBookingForPractice(entity, service.Name), cancellationToken);
        await _emailSender.SendAsync(BookingEmails.NewBookingForClient(entity, service.Name), cancellationToken);

        return entity.Id;
    }
}
