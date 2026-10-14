using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Booking.Services;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Appointments.Commands;

/// <summary>
/// Pending → Confirmed. Starea se salvează ÎNAINTE de apelurile de rețea (Google, SMTP),
/// care nu pot face cererea să eșueze — doar marchează sincronizarea ca Failed.
/// </summary>
public record ConfirmAppointmentCommand(int Id) : IRequest<Unit>;

public class ConfirmAppointmentCommandValidator : AbstractValidator<ConfirmAppointmentCommand>
{
    public ConfirmAppointmentCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Identificatorul cererii este invalid.");
    }
}

public class ConfirmAppointmentCommandHandler : IRequestHandler<ConfirmAppointmentCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly ICalendarService _calendar;
    private readonly IEmailSender _emailSender;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<ConfirmAppointmentCommandHandler> _logger;

    public ConfirmAppointmentCommandHandler(
        IAppDbContext db,
        ICalendarService calendar,
        IEmailSender emailSender,
        IDateTimeProvider clock,
        ILogger<ConfirmAppointmentCommandHandler> logger)
    {
        _db = db;
        _calendar = calendar;
        _emailSender = emailSender;
        _clock = clock;
        _logger = logger;
    }

    public async Task<Unit> Handle(ConfirmAppointmentCommand request, CancellationToken cancellationToken)
    {
        var entity = await AppointmentCalendar.LoadAsync(_db, request.Id, cancellationToken);
        if (entity.Status != AppointmentStatus.Pending)
            throw new ConflictException("Doar programările în așteptare pot fi confirmate.");

        entity.Status = AppointmentStatus.Confirmed;
        entity.ConfirmedAt = _clock.UtcNow;
        entity.IsHandled = true;
        entity.GoogleSyncState = _calendar.IsEnabled ? SyncState.Pending : SyncState.NotNeeded;
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Programarea {AppointmentRequestId} a fost confirmată.", entity.Id);

        if (_calendar.IsEnabled)
            await AppointmentCalendar.CreateEventAsync(_db, _calendar, entity, _logger, cancellationToken);

        var serviceName = entity.Service?.Name;
        await _emailSender.SendAsync(BookingEmails.ConfirmedForClient(entity, serviceName, _clock.UtcNow), cancellationToken);
        await _emailSender.SendAsync(BookingEmails.ConfirmedCopyForPractice(entity, serviceName), cancellationToken);

        return Unit.Value;
    }
}

/// <summary>Pașii comuni pentru confirmare, respingere, anulare și resincronizare.</summary>
internal static class AppointmentCalendar
{
    public static async Task<AppointmentRequest> LoadAsync(IAppDbContext db, int id, CancellationToken cancellationToken) =>
        await db.AppointmentRequests
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken)
        ?? throw new NotFoundException(nameof(AppointmentRequest), id);

    /// <summary>Creează evenimentul și salvează rezultatul: Synced + GoogleEventId sau Failed.</summary>
    public static async Task CreateEventAsync(
        IAppDbContext db,
        ICalendarService calendar,
        AppointmentRequest entity,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        // Doar nume și telefon în eveniment — ele sunt deja în contul Google al cabinetului.
        var eventId = await calendar.CreateEventAsync(
            new CalendarEventRequest(
                $"{entity.FullName} - {entity.Service?.Name ?? "Ședință"}",
                $"Telefon: {entity.Phone}\nMod: {entity.PreferredMode}",
                DateTime.SpecifyKind(entity.StartAt!.Value, DateTimeKind.Utc),
                DateTime.SpecifyKind(entity.EndAt!.Value, DateTimeKind.Utc)),
            cancellationToken);

        entity.GoogleEventId = eventId ?? entity.GoogleEventId;
        entity.GoogleSyncState = eventId is null ? SyncState.Failed : SyncState.Synced;
        await db.SaveChangesAsync(cancellationToken);

        if (eventId is null)
            logger.LogWarning("Sincronizarea cu Google Calendar a eșuat pentru programarea {AppointmentRequestId}.", entity.Id);
    }
}
