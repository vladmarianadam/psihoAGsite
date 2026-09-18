using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Media.Commands;

public record DeleteImageCommand(int Id) : IRequest<Unit>;

public class DeleteImageCommandValidator : AbstractValidator<DeleteImageCommand>
{
    public DeleteImageCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0)
            .WithMessage("Identificatorul imaginii este invalid.");
    }
}

public class DeleteImageCommandHandler : IRequestHandler<DeleteImageCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly IFileStorage _storage;

    public DeleteImageCommandHandler(IAppDbContext db, IFileStorage storage)
    {
        _db = db;
        _storage = storage;
    }

    public async Task<Unit> Handle(DeleteImageCommand request, CancellationToken cancellationToken)
    {
        var asset = await _db.MediaAssets
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(MediaAsset), request.Id);

        // Dacă fișierul lipsește deja de pe disc, DeleteAsync întoarce false —
        // înregistrarea din DB se șterge oricum, ca să nu rămână orfană (plan §7).
        await _storage.DeleteAsync(asset.Url, cancellationToken);

        _db.MediaAssets.Remove(asset);
        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
