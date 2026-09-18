using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Services.Commands;

public record DeleteServiceCommand(int Id) : IRequest<Unit>;

public class DeleteServiceCommandValidator : AbstractValidator<DeleteServiceCommand>
{
    public DeleteServiceCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0)
            .WithMessage("Identificatorul serviciului este invalid.");
    }
}

public class DeleteServiceCommandHandler : IRequestHandler<DeleteServiceCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteServiceCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(DeleteServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await _db.Services
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Service), request.Id);

        // Cererile de programare rămân: FK-ul AppointmentRequest.ServiceId este configurat cu
        // DeleteBehavior.SetNull (plan §4), deci baza de date îl trece automat pe null.
        _db.Services.Remove(service);
        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
