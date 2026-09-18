using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace PsihoAdinaGghita.Infrastructure.Persistence;

/// <summary>
/// Folosit doar de uneltele EF Core la generarea migrărilor
/// (<c>dotnet ef migrations add ... --project ... --startup-project ...Infrastructure</c>).
/// Există ca proiectul Api să nu aibă nevoie de pachetul EntityFrameworkCore.Design —
/// stratul de prezentare rămâne curat de infrastructură EF (plan §2).
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("PSIHO_DESIGN_CONNECTION")
            ?? "Data Source=psiho-design.db";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connectionString)
            .Options;

        return new AppDbContext(options);
    }
}
