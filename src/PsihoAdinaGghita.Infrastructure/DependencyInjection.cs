using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Infrastructure.Calendar;
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
        // Citită la rezolvare, nu aici: sursele adăugate după AddInfrastructure (ex. testele de
        // integrare) altfel n-ar fi văzute și toate hosturile ar împărți același psiho.db.
        services.AddDbContext<AppDbContext>((sp, options) => options.UseSqlite(
            sp.GetRequiredService<IConfiguration>().GetConnectionString("Default") ?? "Data Source=psiho.db"));
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<DbSeeder>();

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));
        services.Configure<GoogleCalendarOptions>(configuration.GetSection(GoogleCalendarOptions.SectionName));
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

        // Singleton: clientul Google și cache-ul FreeBusy (2 min) trăiesc cât aplicația.
        services.AddMemoryCache();
        services.AddSingleton<ICalendarService, GoogleCalendarService>();

        return services;
    }
}
