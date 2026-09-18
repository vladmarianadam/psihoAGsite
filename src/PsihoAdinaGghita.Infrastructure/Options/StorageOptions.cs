namespace PsihoAdinaGghita.Infrastructure.Options;

public class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>Rădăcina fizică pentru fișiere publice (wwwroot al Api-ului).</summary>
    public string WebRootPath { get; set; } = string.Empty;

    /// <summary>Subfolderul pentru încărcări, relativ la WebRootPath.</summary>
    public string UploadsFolder { get; set; } = "uploads";

    public long MaxFileSizeBytes { get; set; } = 5 * 1024 * 1024;
    public int MaxImageWidth { get; set; } = 1600;
    public int WebpQuality { get; set; } = 80;
}
