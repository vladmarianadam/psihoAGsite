namespace PsihoAdinaGghita.Infrastructure.Options;

public class AdminSeedOptions
{
    public const string SectionName = "AdminSeed";

    public string Username { get; set; } = "admin";
    public string FullName { get; set; } = "Adina Gghita";

    /// <summary>Parolă temporară din User Secrets / variabilă de mediu; se schimbă obligatoriu la primul login.</summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>Dacă e true, se inserează și conținut demo (categorii, servicii, FAQ, articole).</summary>
    public bool SeedDemoContent { get; set; } = true;
}
