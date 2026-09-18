namespace PsihoAdinaGghita.Infrastructure.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "PsihoAdinaGghita";
    public string Audience { get; set; } = "PsihoAdinaGghita.Client";

    /// <summary>Minim 32 bytes; provine din User Secrets (dev) sau variabilă de mediu (prod).</summary>
    public string SigningKey { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}
