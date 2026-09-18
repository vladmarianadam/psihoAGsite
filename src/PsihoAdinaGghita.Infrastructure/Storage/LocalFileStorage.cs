using System.Security.Cryptography;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PsihoAdinaGghita.Application.Common.Helpers;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Infrastructure.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using ValidationException = PsihoAdinaGghita.Application.Common.Exceptions.ValidationException;

namespace PsihoAdinaGghita.Infrastructure.Storage;

/// <summary>
/// Stocare pe disc, sub wwwroot/uploads/{yyyy}/{MM}. Validează extensia, content-type-ul,
/// dimensiunea și magic bytes-urile reale, apoi normalizează imaginea în WebP (plan §7).
/// </summary>
public class LocalFileStorage : IFileStorage
{
    private const int HeaderBytes = 12;
    private const int MaxSlugLength = 40;
    private const string FallbackSlug = "imagine";

    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp"];

    private readonly StorageOptions _options;
    private readonly ILogger<LocalFileStorage> _logger;

    public LocalFileStorage(IOptions<StorageOptions> options, ILogger<LocalFileStorage> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    private static ReadOnlySpan<byte> PngSignature => [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    private string UploadsFolder =>
        string.IsNullOrWhiteSpace(_options.UploadsFolder) ? "uploads" : _options.UploadsFolder.Trim('/', '\\');

    public async Task<StoredFile> SaveImageAsync(
        Stream content,
        string originalFileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(content);

        // 1. extensia declarată
        var extension = ExtractExtension(originalFileName);
        if (!AllowedExtensions.Contains(extension))
            throw Invalid("Sunt permise doar imagini .jpg, .jpeg, .png sau .webp.");

        // 2. content-type declarat
        var declaredType = (contentType ?? string.Empty).Split(';')[0].Trim().ToLowerInvariant();
        if (!AllowedContentTypes.Contains(declaredType))
            throw Invalid("Tipul fișierului trebuie să fie image/jpeg, image/png sau image/webp.");

        var maxBytes = _options.MaxFileSizeBytes > 0 ? _options.MaxFileSizeBytes : 5 * 1024 * 1024;

        // 3. dimensiunea; dacă streamul nu e seekabil îl copiem într-un MemoryStream (cu plafon).
        Stream working;
        MemoryStream? buffered = null;
        if (content.CanSeek)
        {
            EnsureSizeAllowed(content.Length - content.Position, maxBytes);
            working = content;
        }
        else
        {
            buffered = await CopyWithLimitAsync(content, maxBytes, cancellationToken);
            working = buffered;
        }

        try
        {
            var startPosition = working.Position;

            // 4. magic bytes reale — extensia și content-type-ul pot fi falsificate.
            var header = await ReadHeaderAsync(working, HeaderBytes, cancellationToken);
            if (!HasAllowedSignature(header))
                throw Invalid("Conținutul fișierului nu corespunde unei imagini JPEG, PNG sau WebP.");

            working.Position = startPosition;

            using var image = await LoadImageAsync(working, cancellationToken);

            var maxWidth = _options.MaxImageWidth > 0 ? _options.MaxImageWidth : 1600;
            if (image.Width > maxWidth)
            {
                var targetHeight = Math.Max(1, (int)Math.Round(image.Height * (double)maxWidth / image.Width));
                image.Mutate(ctx => ctx.Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(maxWidth, targetHeight),
                }));
            }

            var now = DateTime.UtcNow;
            var year = now.ToString("yyyy");
            var month = now.ToString("MM");
            var absoluteFolder = Path.Combine(_options.WebRootPath, UploadsFolder, year, month);
            Directory.CreateDirectory(absoluteFolder);

            var slug = BuildSlug(originalFileName, extension);
            var (fileName, fullPath) = CreateUniquePath(absoluteFolder, slug);

            var quality = _options.WebpQuality is > 0 and <= 100 ? _options.WebpQuality : 80;
            var encoder = new WebpEncoder { Quality = quality };

            await using (var output = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, useAsync: true))
            {
                await image.SaveAsWebpAsync(output, encoder, cancellationToken);
            }

            var sizeBytes = new FileInfo(fullPath).Length;
            var url = $"/{UploadsFolder}/{year}/{month}/{fileName}";

            _logger.LogInformation("Imagine salvată: {Url} ({SizeBytes} bytes, {Width}x{Height}).",
                url, sizeBytes, image.Width, image.Height);

            return new StoredFile(fileName, url, "image/webp", sizeBytes);
        }
        finally
        {
            if (buffered is not null)
                await buffered.DisposeAsync();
        }
    }

    public Task<bool> DeleteAsync(string url, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url))
            return Task.FromResult(false);

        var expectedPrefix = $"/{UploadsFolder}/";
        if (!url.StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Ștergere refuzată: URL-ul {Url} nu se află în folderul de încărcări.", url);
            return Task.FromResult(false);
        }

        var uploadsRoot = Path.GetFullPath(Path.Combine(_options.WebRootPath, UploadsFolder))
            .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        string fullPath;
        try
        {
            var relative = url[1..].Replace('/', Path.DirectorySeparatorChar);
            fullPath = Path.GetFullPath(Path.Combine(_options.WebRootPath, relative));
        }
        catch (Exception ex) when (ex is ArgumentException or NotSupportedException or PathTooLongException)
        {
            _logger.LogWarning("Ștergere refuzată: URL-ul {Url} nu poate fi transformat într-o cale validă.", url);
            return Task.FromResult(false);
        }

        // Protecție path traversal: calea rezolvată trebuie să rămână sub rădăcina de încărcări.
        if (!fullPath.StartsWith(uploadsRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Ștergere refuzată: URL-ul {Url} iese din rădăcina de încărcări.", url);
            return Task.FromResult(false);
        }

        if (!File.Exists(fullPath))
        {
            _logger.LogInformation("Fișierul {Url} nu există; nu este nimic de șters.", url);
            return Task.FromResult(false);
        }

        File.Delete(fullPath);
        _logger.LogInformation("Fișier șters: {Url}.", url);
        return Task.FromResult(true);
    }

    private static ValidationException Invalid(string message) =>
        new(new Dictionary<string, string[]> { ["file"] = [message] });

    private static void EnsureSizeAllowed(long sizeBytes, long maxBytes)
    {
        if (sizeBytes <= 0)
            throw Invalid("Fișierul încărcat este gol.");

        if (sizeBytes > maxBytes)
            throw Invalid($"Fișierul depășește dimensiunea maximă permisă de {FormatMegabytes(maxBytes)} MB.");
    }

    private static string FormatMegabytes(long bytes) =>
        (bytes / 1024d / 1024d).ToString("0.#", System.Globalization.CultureInfo.InvariantCulture);

    /// <summary>Copiază streamul ne-seekabil, oprindu-se imediat ce se depășește plafonul.</summary>
    private static async Task<MemoryStream> CopyWithLimitAsync(Stream source, long maxBytes, CancellationToken cancellationToken)
    {
        var buffer = new byte[81920];
        var destination = new MemoryStream();
        long total = 0;

        try
        {
            int read;
            while ((read = await source.ReadAsync(buffer, cancellationToken)) > 0)
            {
                total += read;
                if (total > maxBytes)
                    throw Invalid($"Fișierul depășește dimensiunea maximă permisă de {FormatMegabytes(maxBytes)} MB.");

                await destination.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            }
        }
        catch
        {
            await destination.DisposeAsync();
            throw;
        }

        if (total == 0)
        {
            await destination.DisposeAsync();
            throw Invalid("Fișierul încărcat este gol.");
        }

        destination.Position = 0;
        return destination;
    }

    private static async Task<byte[]> ReadHeaderAsync(Stream stream, int count, CancellationToken cancellationToken)
    {
        var buffer = new byte[count];
        var read = 0;

        while (read < count)
        {
            var current = await stream.ReadAsync(buffer.AsMemory(read, count - read), cancellationToken);
            if (current == 0)
                break;
            read += current;
        }

        return read == count ? buffer : buffer[..read];
    }

    private static bool HasAllowedSignature(ReadOnlySpan<byte> header)
    {
        // JPEG: FF D8 FF
        if (header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return true;

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (header.Length >= 8 && header[..8].SequenceEqual(PngSignature))
            return true;

        // WEBP: "RIFF" ... "WEBP" la offset 8
        if (header.Length >= 12 && header[..4].SequenceEqual("RIFF"u8) && header[8..12].SequenceEqual("WEBP"u8))
            return true;

        return false;
    }

    private static async Task<Image> LoadImageAsync(Stream stream, CancellationToken cancellationToken)
    {
        try
        {
            return await Image.LoadAsync(stream, cancellationToken);
        }
        catch (ImageFormatException)
        {
            throw Invalid("Imaginea nu a putut fi citită; fișierul pare corupt.");
        }
    }

    /// <summary>Numele original devine slug (doar a-z, 0-9 și cratimă), fără a atinge calea primită.</summary>
    private static string BuildSlug(string originalFileName, string extension)
    {
        var name = (originalFileName ?? string.Empty).Trim();
        if (name.EndsWith(extension, StringComparison.OrdinalIgnoreCase))
            name = name[..^extension.Length];

        var slug = SlugHelper.Generate(name, MaxSlugLength);
        return string.IsNullOrWhiteSpace(slug) ? FallbackSlug : slug;
    }

    private static (string FileName, string FullPath) CreateUniquePath(string absoluteFolder, string slug)
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var candidate = $"{slug}-{RandomSuffix()}.webp";
            var fullPath = Path.Combine(absoluteFolder, candidate);
            if (!File.Exists(fullPath))
                return (candidate, fullPath);
        }

        throw new IOException("Nu s-a putut genera un nume unic de fișier pentru imaginea încărcată.");
    }

    private static string RandomSuffix() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(4)).ToLowerInvariant();

    private static string ExtractExtension(string fileName)
    {
        var name = (fileName ?? string.Empty).Trim();
        var lastDot = name.LastIndexOf('.');
        return lastDot < 0 ? string.Empty : name[lastDot..].ToLowerInvariant();
    }
}
