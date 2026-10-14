using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Booking.Services;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Appointments.Commands;

/// <summary>Pending → Rejected; motivul (opțional) ajunge în emailul către client.</summary>
public record RejectAppointmentCommand(int Id, string? Reason) : IRequest<Unit>;

public class RejectAppointmentCommandValidator : AbstractValidator<RejectAppointmentCommand>
{
    public RejectAppointmentCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Identificatorul cererii este invalid.");

        RuleFor(x => x.Reason)
            .MaximumLength(1000).WithMessage("Motivul poate avea maxim 1000 de caractere.");
    }
}

public class RejectAppointmentCommandHandler : IRequestHandler<RejectAppointmentCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<RejectAppointmentCommandHandler> _logger;

    public RejectAppointmentCommandHandler(
        IAppDbContext db,
        IEmailSender emailSender,
        ILogger<RejectAppointmentCommandHandler> logger)
    {
        _db = db;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task<Unit> Handle(RejectAppointmentCommand request, CancellationToken cancellationToken)
    {
        var entity = await AppointmentCalendar.LoadAsync(_db, request.Id, cancellationToken);
        if (entity.Status != AppointmentStatus.Pending)
            throw new ConflictException("Doar programările în așteptare pot fi respinse.");

        entity.Status = AppointmentStatus.Rejected;
        entity.RejectReason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
        entity.IsHandled = true;
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Programarea {AppointmentRequestId} a fost respinsă.", entity.Id);

        await _emailSender.SendAsync(BookingEmails.RejectedForClient(entity, entity.Service?.Name), cancellationToken);

        return Unit.Value;
    }
}
