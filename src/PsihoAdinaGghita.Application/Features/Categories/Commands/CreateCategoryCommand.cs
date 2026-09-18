using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Helpers;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Categories.Commands;

public record CreateCategoryCommand(
    string Name,
    string? Slug,
    string? Description,
    int DisplayOrder) : IRequest<int>;

public class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryCommandValidator()
    {
        // Lungimile respectă CategoryConfiguration (Name 100, Slug 100, Description 500).
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100)
            .WithMessage("Numele categoriei este obligatoriu (maxim 100 de caractere).");

        RuleFor(x => x.Description).MaximumLength(500)
            .WithMessage("Descrierea poate avea maxim 500 de caractere.");

        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0)
            .WithMessage("Ordinea de afișare nu poate fi negativă.");

        RuleFor(x => x.Slug)
            .MaximumLength(100)
            .Matches("^[a-z0-9-]+$")
            .WithMessage("Slug-ul poate conține doar litere mici, cifre și cratime (maxim 100 de caractere).")
            .When(x => !string.IsNullOrWhiteSpace(x.Slug));
    }
}

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, int>
{
    private const int MaxSlugLength = 100;

    private readonly IAppDbContext _db;

    public CreateCategoryCommandHandler(IAppDbContext db) => _db = db;

    public async Task<int> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = new Category
        {
            Name = request.Name.Trim(),
            Slug = await ResolveSlugAsync(request.Slug, request.Name, cancellationToken),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            DisplayOrder = request.DisplayOrder,
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync(cancellationToken);

        return category.Id;
    }

    /// <summary>
    /// Slug explicit deja folosit → conflict; slug generat automat primește sufix numeric (-2, -3…).
    /// </summary>
    private async Task<string> ResolveSlugAsync(string? requestedSlug, string name, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(requestedSlug))
        {
            var explicitSlug = requestedSlug.Trim();
            if (await _db.Categories.AnyAsync(x => x.Slug == explicitSlug, cancellationToken))
                throw new ConflictException($"Slug-ul „{explicitSlug}” este deja folosit de altă categorie.");

            return explicitSlug;
        }

        var baseSlug = SlugHelper.Generate(name, MaxSlugLength);
        if (string.IsNullOrEmpty(baseSlug))
            throw new ConflictException("Din numele categoriei nu se poate genera un slug valid; completează manual câmpul slug.");

        var candidate = baseSlug;
        var suffix = 2;
        while (await _db.Categories.AnyAsync(x => x.Slug == candidate, cancellationToken))
        {
            var suffixText = $"-{suffix++}";
            var trimmedBase = baseSlug.Length + suffixText.Length > MaxSlugLength
                ? baseSlug[..(MaxSlugLength - suffixText.Length)].TrimEnd('-')
                : baseSlug;
            candidate = trimmedBase + suffixText;
        }

        return candidate;
    }
}
