using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Articles.Commands;

/// <summary>Publică sau retrage un articol, fără a-i modifica restul conținutului.</summary>
public record PublishArticleCommand(int Id, bool Publish) : IRequest<Unit>;

public class PublishArticleCommandValidator : AbstractValidator<PublishArticleCommand>
{
    public PublishArticleCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Identificatorul articolului este invalid.");
    }
}

public class PublishArticleCommandHandler : IRequestHandler<PublishArticleCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;

    public PublishArticleCommandHandler(IAppDbContext db, IDateTimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<Unit> Handle(PublishArticleCommand request, CancellationToken cancellationToken)
    {
        var article = await _db.Articles.FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken)
                      ?? throw new NotFoundException(nameof(Article), request.Id);

        if (request.Publish)
        {
            article.Status = ArticleStatus.Published;
            article.PublishedAt ??= _clock.UtcNow;
        }
        else
        {
            // Retragerea în ciornă păstrează PublishedAt (data primei publicări).
            article.Status = ArticleStatus.Draft;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
