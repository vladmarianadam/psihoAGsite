using FluentValidation;
using MediatR;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Media.Dtos;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Media.Commands;

/// <summary>
/// Încarcă o imagine în biblioteca media. Controllerul deschide
/// <c>IFormFile.OpenReadStream()</c> și predă streamul aici (plan §7).
/// </summary>
public record UploadImageCommand(
    Stream Content,
    string FileName,
    string ContentType,
    string? AltText) : IRequest<MediaAssetDto>;

public class UploadImageCommandValidator : AbstractValidator<UploadImageCommand>
{
    public UploadImageCommandValidator()
    {
        // Validarea propriu-zisă a fișierului (extensie, content-type, magic bytes,
        // dimensiune) se face în IFileStorage — aici doar metadatele textuale.
        RuleFor(x => x.FileName).NotEmpty()
            .WithMessage("Numele fișierului este obligatoriu.");

        RuleFor(x => x.AltText).MaximumLength(200)
            .WithMessage("Textul alternativ poate avea maxim 200 de caractere.");
    }
}

public class UploadImageCommandHandler : IRequestHandler<UploadImageCommand, MediaAssetDto>
{
    private readonly IAppDbContext _db;
    private readonly IFileStorage _storage;
    private readonly IDateTimeProvider _clock;

    public UploadImageCommandHandler(IAppDbContext db, IFileStorage storage, IDateTimeProvider clock)
    {
        _db = db;
        _storage = storage;
        _clock = clock;
    }

    public async Task<MediaAssetDto> Handle(UploadImageCommand request, CancellationToken cancellationToken)
    {
        var stored = await _storage.SaveImageAsync(
            request.Content,
            request.FileName,
            request.ContentType,
            cancellationToken);

        var altText = string.IsNullOrWhiteSpace(request.AltText) ? null : request.AltText.Trim();

        var asset = new MediaAsset
        {
            FileName = stored.FileName,
            Url = stored.Url,
            ContentType = stored.ContentType,
            SizeBytes = stored.SizeBytes,
            AltText = altText,
            UploadedAt = _clock.UtcNow,
        };

        _db.MediaAssets.Add(asset);
        await _db.SaveChangesAsync(cancellationToken);

        return new MediaAssetDto(
            asset.Id,
            asset.FileName,
            asset.Url,
            asset.ContentType,
            asset.SizeBytes,
            asset.AltText,
            asset.UploadedAt);
    }
}
