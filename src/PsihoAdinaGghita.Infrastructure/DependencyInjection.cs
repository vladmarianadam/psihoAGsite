using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Infrastructure.Email;
using PsihoAdinaGghita.Infrastructure.Identity;
using PsihoAdinaGghita.Infrastructure.Options;
using PsihoAdinaGghita.Infrastructure.Persistence;
using PsihoAdinaGghita.Infrastructure.Services;
using PsihoAdinaGghita.Infrastructure.Storage;

namespace PsihoAdinaGghita.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        string webRootPath)
    {
        // SQLite — singurul loc din soluție care cunoaște providerul EF (plan §2).
        var connectionString = configuration.GetConnectionString("Default")
            ?? "Data Source=psiho.db";

        services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<DbSeeder>();

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));
        services.Configure<AdminSeedOptions>(configuration.GetSection(AdminSeedOptions.SectionName));
        services.Configure<StorageOptions>(options =>
        {
            configuration.GetSection(StorageOptions.SectionName).Bind(options);
            if (string.IsNullOrWhiteSpace(options.WebRootPath))
                options.WebRootPath = webRootPath;
        });

        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
        services.AddSingleton<IHtmlSanitizer, HtmlSanitizerAdapter>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IEmailSender, MailKitEmailSender>();
        services.AddScoped<IFileStorage, LocalFileStorage>();

        return services;
    }
}
