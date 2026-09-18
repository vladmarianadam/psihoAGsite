namespace PsihoAdinaGghita.Application.Features.Media.Dtos;

public record MediaAssetDto(
    int Id,
    string FileName,
    string Url,
    string ContentType,
    long SizeBytes,
    string? AltText,
    DateTime UploadedAt);
