using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;

namespace PsihoAdinaGghita.Application.Features.Articles.Commands;

/// <summary>
/// Incrementează numărul de vizualizări al unui articol. Se execută direct în baza de date
/// (UPDATE ... SET ViewCount = ViewCount + 1), deci nu încarcă entitatea și nu trece prin
/// change tracker — astfel <c>UpdatedAt</c> rămâne neatins de simplele afișări.
/// </summary>
public record IncrementArticleViewCountCommand(int ArticleId) : IRequest<Unit>;

public class IncrementArticleViewCountCommandValidator : AbstractValidator<IncrementArticleViewCountCommand>
{
    public IncrementArticleViewCountCommandValidator()
    {
        RuleFor(x => x.ArticleId)
            .GreaterThan(0).WithMessage("Identificatorul articolului este invalid.");
    }
}

public class IncrementArticleViewCountCommandHandler : IRequestHandler<IncrementArticleViewCountCommand, Unit>
{
    private readonly IAppDbContext _db;

    public IncrementArticleViewCountCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(IncrementArticleViewCountCommand request, CancellationToken cancellationToken)
    {
        // Articol inexistent → 0 rânduri afectate, fără excepție: statistica de afișări
        // nu trebuie să transforme o navigare într-o eroare.
        await _db.Articles
            .Where(a => a.Id == request.ArticleId)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(a => a.ViewCount, a => a.ViewCount + 1),
                cancellationToken);

        return Unit.Value;
    }
}
