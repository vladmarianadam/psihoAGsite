using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Helpers;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Articles.Commands;

/// <summary>
/// Actualizează un articol existent. <c>Publish</c> reflectă starea dorită după salvare,
/// deci formularul de administrare trebuie să trimită statusul curent al articolului.
/// </summary>
public record UpdateArticleCommand(
    int Id,
    string Title,
    string? Slug,
    string Excerpt,
    string ContentHtml,
    string? CoverImageUrl,
    string? CoverImageAlt,
    int? CategoryId,
    string? MetaTitle,
    string? MetaDescription,
    bool Publish = false) : IRequest<Unit>;

public class UpdateArticleCommandValidator : AbstractValidator<UpdateArticleCommand>
{
    public UpdateArticleCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Identificatorul articolului este invalid.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Titlul este obligatoriu.")
            .MaximumLength(200).WithMessage("Titlul poate avea maxim 200 de caractere.");

        RuleFor(x => x.Excerpt)
            .NotEmpty().WithMessage("Rezumatul este obligatoriu.")
            .MaximumLength(500).WithMessage("Rezumatul poate avea maxim 500 de caractere.");

        RuleFor(x => x.ContentHtml)
            .NotEmpty().WithMessage("Conținutul articolului este obligatoriu.");

        RuleFor(x => x.Slug)
            .Matches("^[a-z0-9-]+$")
                .WithMessage("Slug-ul poate conține numai litere mici fără diacritice, cifre și cratime.")
            .MaximumLength(200)
                .WithMessage("Slug-ul poate avea maxim 200 de caractere.")
            .When(x => !string.IsNullOrWhiteSpace(x.Slug));

        RuleFor(x => x.MetaTitle)
            .MaximumLength(200).WithMessage("Meta-titlul poate avea maxim 200 de caractere.");

        RuleFor(x => x.MetaDescription)
            .MaximumLength(300).WithMessage("Meta-descrierea poate avea maxim 300 de caractere.");

        RuleFor(x => x.CoverImageAlt)
            .MaximumLength(200).WithMessage("Textul alternativ al imaginii poate avea maxim 200 de caractere.");

        RuleFor(x => x.CoverImageUrl)
            .MaximumLength(500).WithMessage("Adresa imaginii de copertă poate avea maxim 500 de caractere.");
    }
}

public class UpdateArticleCommandHandler : IRequestHandler<UpdateArticleCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly IHtmlSanitizer _sanitizer;
    private readonly IDateTimeProvider _clock;

    public UpdateArticleCommandHandler(IAppDbContext db, IHtmlSanitizer sanitizer, IDateTimeProvider clock)
    {
        _db = db;
        _sanitizer = sanitizer;
        _clock = clock;
    }

    public async Task<Unit> Handle(UpdateArticleCommand request, CancellationToken cancellationToken)
    {
        var article = await _db.Articles.FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken)
                      ?? throw new NotFoundException(nameof(Article), request.Id);

        if (request.CategoryId is int categoryId
            && !await _db.Categories.AsNoTracking().AnyAsync(c => c.Id == categoryId, cancellationToken))
        {
            throw new NotFoundException(nameof(Category), categoryId);
        }

        var contentHtml = _sanitizer.Sanitize(request.ContentHtml);

        // Slug-ul curent se păstrează dacă utilizatorul nu a trimis unul nou; altfel se
        // rezolvă cu aceleași reguli ca la creare (unicitate ignorând articolul curent).
        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? article.Slug
            : await ArticleSlugResolver.ResolveAsync(_db, request.Slug, request.Title, article.Id, cancellationToken);

        article.Title = request.Title.Trim();
        article.Slug = slug;
        article.Excerpt = request.Excerpt.Trim();
        article.ContentHtml = contentHtml;
        article.CoverImageUrl = string.IsNullOrWhiteSpace(request.CoverImageUrl) ? null : request.CoverImageUrl.Trim();
        article.CoverImageAlt = string.IsNullOrWhiteSpace(request.CoverImageAlt) ? null : request.CoverImageAlt.Trim();
        article.CategoryId = request.CategoryId;
        article.MetaTitle = string.IsNullOrWhiteSpace(request.MetaTitle) ? null : request.MetaTitle.Trim();
        article.MetaDescription = string.IsNullOrWhiteSpace(request.MetaDescription) ? null : request.MetaDescription.Trim();
        article.ReadingMinutes = ReadingTimeHelper.Calculate(contentHtml);

        if (request.Publish)
        {
            article.Status = ArticleStatus.Published;
            article.PublishedAt ??= _clock.UtcNow;
        }
        else
        {
            // Retragerea păstrează PublishedAt, ca să nu se piardă data primei publicări.
            article.Status = ArticleStatus.Draft;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
