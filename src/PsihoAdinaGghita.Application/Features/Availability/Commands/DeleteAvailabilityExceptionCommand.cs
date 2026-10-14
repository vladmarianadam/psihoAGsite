using MediatR;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Availability.Commands;

public record DeleteAvailabilityExceptionCommand(int Id) : IRequest<Unit>;

public class DeleteAvailabilityExceptionCommandHandler : IRequestHandler<DeleteAvailabilityExceptionCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteAvailabilityExceptionCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(DeleteAvailabilityExceptionCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.AvailabilityExceptions.FindAsync(new object?[] { request.Id }, cancellationToken)
            ?? throw new NotFoundException(nameof(AvailabilityException), request.Id);

        _db.AvailabilityExceptions.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
