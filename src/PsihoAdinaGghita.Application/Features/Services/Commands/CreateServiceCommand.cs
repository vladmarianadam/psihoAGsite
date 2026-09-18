using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Helpers;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Services.Commands;

public record CreateServiceCommand(
    string Name,
    string? Slug,
    string ShortDescription,
    string? LongDescriptionHtml,
    decimal? Price,
    string? PriceUnit,
    int DurationMinutes,
    string? IconName,
    string? ImageUrl,
    string SessionMode,
    int DisplayOrder,
    bool IsActive) : IRequest<int>;

public class CreateServiceCommandValidator : AbstractValidator<CreateServiceCommand>
{
    public CreateServiceCommandValidator()
    {
        // Lungimile respectă ServiceConfiguration (Name/Slug 150, ShortDescription 500,
        // PriceUnit 50, IconName 50, ImageUrl 500).
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150)
            .WithMessage("Denumirea serviciului este obligatorie (maxim 150 de caractere).");

        RuleFor(x => x.ShortDescription).NotEmpty().MaximumLength(500)
            .WithMessage("Descrierea scurtă este obligatorie (maxim 500 de caractere).");

        RuleFor(x => x.Price).GreaterThanOrEqualTo(0m)
            .WithMessage("Prețul nu poate fi negativ.")
            .When(x => x.Price.HasValue);

        RuleFor(x => x.PriceUnit).MaximumLength(50)
            .WithMessage("Unitatea de preț poate avea maxim 50 de caractere.");

        RuleFor(x => x.DurationMinutes).InclusiveBetween(0, 480)
            .WithMessage("Durata trebuie să fie între 0 și 480 de minute.");

        RuleFor(x => x.IconName).MaximumLength(50)
            .WithMessage("Numele iconiței poate avea maxim 50 de caractere.");

        RuleFor(x => x.ImageUrl).MaximumLength(500)
            .WithMessage("Adresa imaginii poate avea maxim 500 de caractere.");

        RuleFor(x => x.SessionMode).NotEmpty()
            .Must(BeValidSessionMode)
            .WithMessage("Modul de desfășurare trebuie să fie Cabinet, Online sau Both.");

        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0)
            .WithMessage("Ordinea de afișare nu poate fi negativă.");

        RuleFor(x => x.Slug)
            .MaximumLength(150)
            .Matches("^[a-z0-9-]+$")
            .WithMessage("Slug-ul poate conține doar litere mici, cifre și cratime (maxim 150 de caractere).")
            .When(x => !string.IsNullOrWhiteSpace(x.Slug));
    }

    /// <summary>Parsare tolerantă la majuscule; valorile numerice sau necunoscute sunt respinse.</summary>
    private static bool BeValidSessionMode(string? value) =>
        Enum.TryParse<SessionMode>(value, ignoreCase: true, out var mode)
        && Enum.IsDefined(typeof(SessionMode), mode)
        && !int.TryParse(value, out _);
}

public class CreateServiceCommandHandler : IRequestHandler<CreateServiceCommand, int>
{
    private const int MaxSlugLength = 150;

    private readonly IAppDbContext _db;
    private readonly IHtmlSanitizer _sanitizer;

    public CreateServiceCommandHandler(IAppDbContext db, IHtmlSanitizer sanitizer)
    {
        _db = db;
        _sanitizer = sanitizer;
    }

    public async Task<int> Handle(CreateServiceCommand request, CancellationToken cancellationToken)
    {
        var service = new Service
        {
            Name = request.Name.Trim(),
            Slug = await ResolveSlugAsync(request.Slug, request.Name, cancellationToken),
            ShortDescription = request.ShortDescription.Trim(),
            // HTML din editor — sanitizat pe server înainte de salvare (plan §7).
            LongDescriptionHtml = string.IsNullOrWhiteSpace(request.LongDescriptionHtml)
                ? null
                : _sanitizer.Sanitize(request.LongDescriptionHtml),
            Price = request.Price,
            PriceUnit = string.IsNullOrWhiteSpace(request.PriceUnit) ? null : request.PriceUnit.Trim(),
            DurationMinutes = request.DurationMinutes,
            IconName = string.IsNullOrWhiteSpace(request.IconName) ? null : request.IconName.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
            SessionMode = Enum.Parse<SessionMode>(request.SessionMode, ignoreCase: true),
            DisplayOrder = request.DisplayOrder,
            IsActive = request.IsActive,
        };

        _db.Services.Add(service);
        await _db.SaveChangesAsync(cancellationToken);

        return service.Id;
    }

    /// <summary>
    /// Slug explicit deja folosit → conflict; slug generat automat primește sufix numeric (-2, -3…).
    /// </summary>
    private async Task<string> ResolveSlugAsync(string? requestedSlug, string name, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(requestedSlug))
        {
            var explicitSlug = requestedSlug.Trim();
            if (await _db.Services.AnyAsync(x => x.Slug == explicitSlug, cancellationToken))
                throw new ConflictException($"Slug-ul „{explicitSlug}” este deja folosit de alt serviciu.");

            return explicitSlug;
        }

        var baseSlug = SlugHelper.Generate(name, MaxSlugLength);
        if (string.IsNullOrEmpty(baseSlug))
            throw new ConflictException("Din denumirea serviciului nu se poate genera un slug valid; completează manual câmpul slug.");

        var candidate = baseSlug;
        var suffix = 2;
        while (await _db.Services.AnyAsync(x => x.Slug == candidate, cancellationToken))
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
