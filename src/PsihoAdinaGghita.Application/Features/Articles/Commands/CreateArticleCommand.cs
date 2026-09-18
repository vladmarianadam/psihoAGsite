using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Helpers;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Articles.Commands;

/// <summary>Creează un articol (ciornă implicit). Returnează id-ul noului articol.</summary>
public record CreateArticleCommand(
    string Title,
    string? Slug,
    string Excerpt,
    string ContentHtml,
    string? CoverImageUrl,
    string? CoverImageAlt,
    int? CategoryId,
    string? MetaTitle,
    string? MetaDescription,
    bool Publish = false) : IRequest<int>;

public class CreateArticleCommandValidator : AbstractValidator<CreateArticleCommand>
{
    public CreateArticleCommandValidator()
    {
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

public class CreateArticleCommandHandler : IRequestHandler<CreateArticleCommand, int>
{
    private readonly IAppDbContext _db;
    private readonly IHtmlSanitizer _sanitizer;
    private readonly IDateTimeProvider _clock;

    public CreateArticleCommandHandler(IAppDbContext db, IHtmlSanitizer sanitizer, IDateTimeProvider clock)
    {
        _db = db;
        _sanitizer = sanitizer;
        _clock = clock;
    }

    public async Task<int> Handle(CreateArticleCommand request, CancellationToken cancellationToken)
    {
        if (request.CategoryId is int categoryId
            && !await _db.Categories.AsNoTracking().AnyAsync(c => c.Id == categoryId, cancellationToken))
        {
            throw new NotFoundException(nameof(Category), categoryId);
        }

        // HTML-ul din editor se curăță pe server înainte de salvare (plan §7).
        var contentHtml = _sanitizer.Sanitize(request.ContentHtml);
        var slug = await ArticleSlugResolver.ResolveAsync(
            _db, request.Slug, request.Title, currentArticleId: null, cancellationToken);
        var now = _clock.UtcNow;

        var article = new Article
        {
            Title = request.Title.Trim(),
            Slug = slug,
            Excerpt = request.Excerpt.Trim(),
            ContentHtml = contentHtml,
            CoverImageUrl = string.IsNullOrWhiteSpace(request.CoverImageUrl) ? null : request.CoverImageUrl.Trim(),
            CoverImageAlt = string.IsNullOrWhiteSpace(request.CoverImageAlt) ? null : request.CoverImageAlt.Trim(),
            CategoryId = request.CategoryId,
            MetaTitle = string.IsNullOrWhiteSpace(request.MetaTitle) ? null : request.MetaTitle.Trim(),
            MetaDescription = string.IsNullOrWhiteSpace(request.MetaDescription) ? null : request.MetaDescription.Trim(),
            ReadingMinutes = ReadingTimeHelper.Calculate(contentHtml),
            Status = request.Publish ? ArticleStatus.Published : ArticleStatus.Draft,
            PublishedAt = request.Publish ? now : null,
            ViewCount = 0,
            CreatedAt = now,
        };

        _db.Articles.Add(article);
        await _db.SaveChangesAsync(cancellationToken);

        return article.Id;
    }
}
