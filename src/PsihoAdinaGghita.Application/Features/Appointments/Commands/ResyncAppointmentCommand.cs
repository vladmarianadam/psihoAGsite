using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Appointments.Commands;

/// <summary>
/// Reîncearcă crearea evenimentului în Google Calendar pentru o programare confirmată.
/// Acceptă și starea Pending: procesul s-a oprit între cele două salvări ale confirmării.
/// </summary>
public record ResyncAppointmentCommand(int Id) : IRequest<Unit>;

public class ResyncAppointmentCommandValidator : AbstractValidator<ResyncAppointmentCommand>
{
    public ResyncAppointmentCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Identificatorul cererii este invalid.");
    }
}

public class ResyncAppointmentCommandHandler : IRequestHandler<ResyncAppointmentCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly ICalendarService _calendar;
    private readonly ILogger<ResyncAppointmentCommandHandler> _logger;

    public ResyncAppointmentCommandHandler(
        IAppDbContext db,
        ICalendarService calendar,
        ILogger<ResyncAppointmentCommandHandler> logger)
    {
        _db = db;
        _calendar = calendar;
        _logger = logger;
    }

    public async Task<Unit> Handle(ResyncAppointmentCommand request, CancellationToken cancellationToken)
    {
        var entity = await AppointmentCalendar.LoadAsync(_db, request.Id, cancellationToken);
        if (entity.Status != AppointmentStatus.Confirmed
            || entity.GoogleSyncState is not (SyncState.Failed or SyncState.Pending))
        {
            throw new ConflictException("Doar programările confirmate cu sincronizarea eșuată pot fi resincronizate.");
        }

        if (!_calendar.IsEnabled)
            throw new ConflictException("Google Calendar nu este configurat pe server.");

        await AppointmentCalendar.CreateEventAsync(_db, _calendar, entity, _logger, cancellationToken);

        return Unit.Value;
    }
}
