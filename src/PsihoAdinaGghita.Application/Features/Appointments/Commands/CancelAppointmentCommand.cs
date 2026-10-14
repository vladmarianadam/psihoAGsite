using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Booking.Services;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Appointments.Commands;

/// <summary>Pending/Confirmed → Cancelled; șterge evenimentul din calendar și anunță clientul.</summary>
public record CancelAppointmentCommand(int Id, string? Reason) : IRequest<Unit>;

public class CancelAppointmentCommandValidator : AbstractValidator<CancelAppointmentCommand>
{
    public CancelAppointmentCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Identificatorul cererii este invalid.");

        RuleFor(x => x.Reason)
            .MaximumLength(1000).WithMessage("Motivul poate avea maxim 1000 de caractere.");
    }
}

public class CancelAppointmentCommandHandler : IRequestHandler<CancelAppointmentCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly ICalendarService _calendar;
    private readonly IEmailSender _emailSender;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<CancelAppointmentCommandHandler> _logger;

    public CancelAppointmentCommandHandler(
        IAppDbContext db,
        ICalendarService calendar,
        IEmailSender emailSender,
        IDateTimeProvider clock,
        ILogger<CancelAppointmentCommandHandler> logger)
    {
        _db = db;
        _calendar = calendar;
        _emailSender = emailSender;
        _clock = clock;
        _logger = logger;
    }

    public async Task<Unit> Handle(CancelAppointmentCommand request, CancellationToken cancellationToken)
    {
        var entity = await AppointmentCalendar.LoadAsync(_db, request.Id, cancellationToken);
        if (entity.Status is not (AppointmentStatus.Pending or AppointmentStatus.Confirmed))
            throw new ConflictException("Doar programările în așteptare sau confirmate pot fi anulate.");

        entity.Status = AppointmentStatus.Cancelled;
        entity.CancelledAt = _clock.UtcNow;
        entity.RejectReason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
        entity.IsHandled = true;
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Programarea {AppointmentRequestId} a fost anulată.", entity.Id);

        if (!string.IsNullOrEmpty(entity.GoogleEventId)
            && !await _calendar.DeleteEventAsync(entity.GoogleEventId, cancellationToken))
        {
            _logger.LogWarning("Evenimentul din Google Calendar al programării {AppointmentRequestId} nu a putut fi șters.", entity.Id);
        }

        await _emailSender.SendAsync(BookingEmails.CancelledForClient(entity, entity.Service?.Name), cancellationToken);

        return Unit.Value;
    }
}
