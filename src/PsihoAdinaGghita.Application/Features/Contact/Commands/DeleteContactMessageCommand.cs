using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Contact.Commands;

/// <summary>Ștergere definitivă — retenție limitată a mesajelor de contact (plan §10).</summary>
public record DeleteContactMessageCommand(int Id) : IRequest<Unit>;

public class DeleteContactMessageCommandValidator : AbstractValidator<DeleteContactMessageCommand>
{
    public DeleteContactMessageCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Identificatorul mesajului este invalid.");
    }
}

public class DeleteContactMessageCommandHandler : IRequestHandler<DeleteContactMessageCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly ILogger<DeleteContactMessageCommandHandler> _logger;

    public DeleteContactMessageCommandHandler(
        IAppDbContext db,
        ILogger<DeleteContactMessageCommandHandler> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Unit> Handle(DeleteContactMessageCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.ContactMessages.FindAsync(new object?[] { request.Id }, cancellationToken)
            ?? throw new NotFoundException(nameof(ContactMessage), request.Id);

        _db.ContactMessages.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);

        // Doar Id-ul și tipul evenimentului — fără date personale (plan §10).
        _logger.LogInformation("Mesajul de contact {ContactMessageId} a fost șters.", request.Id);

        return Unit.Value;
    }
}
