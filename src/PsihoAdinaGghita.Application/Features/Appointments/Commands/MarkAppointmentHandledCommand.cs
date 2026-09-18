using FluentValidation;
using MediatR;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Appointments.Commands;

/// <summary>
/// Marchează o cerere ca rezolvată/nerezolvată. <paramref name="Notes"/> se actualizează
/// doar dacă e trimis (null păstrează notițele existente).
/// </summary>
public record MarkAppointmentHandledCommand(int Id, bool IsHandled, string? Notes) : IRequest<Unit>;

public class MarkAppointmentHandledCommandValidator : AbstractValidator<MarkAppointmentHandledCommand>
{
    public MarkAppointmentHandledCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Identificatorul cererii este invalid.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Notițele pot avea maxim 2000 de caractere.");
    }
}

public class MarkAppointmentHandledCommandHandler : IRequestHandler<MarkAppointmentHandledCommand, Unit>
{
    private readonly IAppDbContext _db;

    public MarkAppointmentHandledCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(MarkAppointmentHandledCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.AppointmentRequests.FindAsync(new object?[] { request.Id }, cancellationToken)
            ?? throw new NotFoundException(nameof(AppointmentRequest), request.Id);

        entity.IsHandled = request.IsHandled;

        if (request.Notes is not null)
            entity.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
