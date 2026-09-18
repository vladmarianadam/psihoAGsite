namespace PsihoAdinaGghita.Application.Common.Interfaces;

public record StoredFile(string FileName, string Url, string ContentType, long SizeBytes);

public interface IFileStorage
{
    /// <summary>
    /// Salvează o imagine încărcată: validează magic bytes, redimensionează și
    /// convertește în WebP, întoarce URL-ul public relativ (/uploads/...).
    /// </summary>
    Task<StoredFile> SaveImageAsync(Stream content, string originalFileName, string contentType, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(string url, CancellationToken cancellationToken = default);
}
