using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PsihoAdinaGghita.Infrastructure.Persistence;

namespace PsihoAdinaGghita.Api.Tests;

/// <summary>
/// Pornește API-ul real (inclusiv migrări + seed) pe o bază SQLite temporară, proprie
/// fiecărei instanțe. Fiecare clasă de teste primește propria fabrică, deci și propriile
/// limitatoare de rată — altfel testele s-ar bloca reciproc pe politica "public-forms".
/// </summary>
public class PsihoApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"psiho-tests-{Guid.NewGuid():N}.db");

    public const string AdminUsername = "admin";
    public const string AdminPassword = "ParolaDeTest!2026";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = $"Data Source={_dbPath}",
                ["Jwt:SigningKey"] = "cheie-de-test-suficient-de-lunga-pentru-hmac-sha256",
                ["AdminSeed:Username"] = AdminUsername,
                ["AdminSeed:Password"] = AdminPassword,
                ["AdminSeed:SeedDemoContent"] = "true",
                ["Smtp:Enabled"] = "false",
                ["Site:PublicUrl"] = "https://test.local",
            });
        });
    }

    public Task InitializeAsync()
    {
        // Forțează construirea hostului (rulează migrările și seed-ul).
        _ = Server;
        return Task.CompletedTask;
    }

    /// <summary>Acces la context pentru verificări directe în baza de date.</summary>
    public T WithDb<T>(Func<AppDbContext, T> action)
    {
        using var scope = Services.CreateScope();
        return action(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();

        try
        {
            if (File.Exists(_dbPath)) File.Delete(_dbPath);
        }
        catch (IOException)
        {
            // Fișierul temporar rămâne în %TEMP% dacă SQLite încă îl ține deschis — irelevant pentru test.
        }
    }
}
