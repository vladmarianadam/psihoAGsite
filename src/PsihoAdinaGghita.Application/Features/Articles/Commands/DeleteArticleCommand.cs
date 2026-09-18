using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Articles.Commands;

/// <summary>Șterge definitiv un articol.</summary>
public record DeleteArticleCommand(int Id) : IRequest<Unit>;

public class DeleteArticleCommandValidator : AbstractValidator<DeleteArticleCommand>
{
    public DeleteArticleCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Identificatorul articolului este invalid.");
    }
}

public class DeleteArticleCommandHandler : IRequestHandler<DeleteArticleCommand, Unit>
{
    private readonly IAppDbContext _db;

    public DeleteArticleCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(DeleteArticleCommand request, CancellationToken cancellationToken)
    {
        var article = await _db.Articles.FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken)
                      ?? throw new NotFoundException(nameof(Article), request.Id);

        _db.Articles.Remove(article);
        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
