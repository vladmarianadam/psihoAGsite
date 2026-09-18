using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Faq.Commands;

public record DeleteFaqItemCommand(int Id) : IRequest<Unit>;

public class DeleteFaqItemCommandValidator : AbstractValidator<DeleteFaqItemCommand>
{
    public DeleteFaqItemCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0)
            .WithMessage("Identificatorul întrebării este invalid.");
    }
}

public class DeleteFaqItemCommandHandler : IRequestHandler<DeleteFaqItemCommand, Unit>
{
    private readonly IAppDbContext _db;
    public DeleteFaqItemCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(DeleteFaqItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _db.FaqItems
            .FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(FaqItem), request.Id);

        _db.FaqItems.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
