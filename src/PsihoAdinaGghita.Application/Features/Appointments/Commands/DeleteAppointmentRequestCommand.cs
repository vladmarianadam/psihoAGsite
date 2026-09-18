using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Appointments.Commands;

/// <summary>Ștergere definitivă — retenție limitată a cererilor de programare (plan §10).</summary>
public record DeleteAppointmentRequestCommand(int Id) : IRequest<Unit>;

public class DeleteAppointmentRequestCommandValidator : AbstractValidator<DeleteAppointmentRequestCommand>
{
    public DeleteAppointmentRequestCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Identificatorul cererii este invalid.");
    }
}

public class DeleteAppointmentRequestCommandHandler : IRequestHandler<DeleteAppointmentRequestCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly ILogger<DeleteAppointmentRequestCommandHandler> _logger;

    public DeleteAppointmentRequestCommandHandler(
        IAppDbContext db,
        ILogger<DeleteAppointmentRequestCommandHandler> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Unit> Handle(DeleteAppointmentRequestCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.AppointmentRequests.FindAsync(new object?[] { request.Id }, cancellationToken)
            ?? throw new NotFoundException(nameof(AppointmentRequest), request.Id);

        _db.AppointmentRequests.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);

        // Doar Id-ul și tipul evenimentului — fără date personale (plan §10).
        _logger.LogInformation("Cererea de programare {AppointmentRequestId} a fost ștearsă.", request.Id);

        return Unit.Value;
    }
}
