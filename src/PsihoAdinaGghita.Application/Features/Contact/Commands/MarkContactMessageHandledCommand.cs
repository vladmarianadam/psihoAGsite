using FluentValidation;
using MediatR;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Contact.Commands;

public record MarkContactMessageHandledCommand(int Id, bool IsHandled) : IRequest<Unit>;

public class MarkContactMessageHandledCommandValidator : AbstractValidator<MarkContactMessageHandledCommand>
{
    public MarkContactMessageHandledCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Identificatorul mesajului este invalid.");
    }
}

public class MarkContactMessageHandledCommandHandler : IRequestHandler<MarkContactMessageHandledCommand, Unit>
{
    private readonly IAppDbContext _db;

    public MarkContactMessageHandledCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(MarkContactMessageHandledCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.ContactMessages.FindAsync(new object?[] { request.Id }, cancellationToken)
            ?? throw new NotFoundException(nameof(ContactMessage), request.Id);

        entity.IsHandled = request.IsHandled;
        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
