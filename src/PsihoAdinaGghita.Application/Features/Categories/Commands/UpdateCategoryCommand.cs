using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Helpers;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Categories.Commands;

public record UpdateCategoryCommand(
    int Id,
    string Name,
    string? Slug,
    string? Description,
    int DisplayOrder) : IRequest<Unit>;

public class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0)
            .WithMessage("Identificatorul categoriei este invalid.");

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

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, Unit>
{
    private const int MaxSlugLength = 100;

    private readonly IAppDbContext _db;

    public UpdateCategoryCommandHandler(IAppDbContext db) => _db = db;

    public async Task<Unit> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _db.Categories
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Category), request.Id);

        category.Name = request.Name.Trim();
        category.Slug = await ResolveSlugAsync(request.Slug, request.Name, request.Id, cancellationToken);
        category.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        category.DisplayOrder = request.DisplayOrder;

        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }

    /// <summary>
    /// Slug explicit deja folosit de altă categorie → conflict; slug generat automat primește sufix numeric.
    /// </summary>
    private async Task<string> ResolveSlugAsync(string? requestedSlug, string name, int currentId, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(requestedSlug))
        {
            var explicitSlug = requestedSlug.Trim();
            if (await _db.Categories.AnyAsync(x => x.Slug == explicitSlug && x.Id != currentId, cancellationToken))
                throw new ConflictException($"Slug-ul „{explicitSlug}” este deja folosit de altă categorie.");

            return explicitSlug;
        }

        var baseSlug = SlugHelper.Generate(name, MaxSlugLength);
        if (string.IsNullOrEmpty(baseSlug))
            throw new ConflictException("Din numele categoriei nu se poate genera un slug valid; completează manual câmpul slug.");

        var candidate = baseSlug;
        var suffix = 2;
        while (await _db.Categories.AnyAsync(x => x.Slug == candidate && x.Id != currentId, cancellationToken))
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
