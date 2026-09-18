using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PsihoAdinaGghita.Api.Middleware;
using PsihoAdinaGghita.Application;
using PsihoAdinaGghita.Infrastructure;
using PsihoAdinaGghita.Infrastructure.Options;
using PsihoAdinaGghita.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    // Enumurile (ArticleStatus, SessionMode) circulă ca text în JSON — altfel clientul
    // ar primi 0/1/2 și tipurile TypeScript ar trebui să fie numerice.
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Cabinet Psihologic Adina Gghita API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT obținut din /api/auth/login",
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = Array.Empty<string>(),
    });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(
    builder.Configuration,
    builder.Environment.WebRootPath ?? Path.Combine(builder.Environment.ContentRootPath, "wwwroot"));
builder.Services.AddHttpContextAccessor();

// Cheia de semnare se completează într-un PostConfigure, nu citită eager din configurație:
// astfel JwtTokenService (emiterea tokenului) și JwtBearer (validarea lui) rezolvă amândouă
// ACELAȘI IOptions<JwtOptions>, indiferent de sursele de configurație adăugate ulterior
// (User Secrets, variabile de mediu, suprascrieri din testele de integrare).
var isDevelopment = builder.Environment.IsDevelopment();

builder.Services.PostConfigure<JwtOptions>(options =>
{
    if (!string.IsNullOrWhiteSpace(options.SigningKey) && Encoding.UTF8.GetByteCount(options.SigningKey) >= 32)
        return;

    if (!isDevelopment)
    {
        throw new InvalidOperationException(
            "Jwt:SigningKey lipsește sau are sub 32 bytes. Se configurează prin variabilă de mediu (plan §10).");
    }

    // Cheie de dezvoltare stabilă, ca să nu invalideze tokenurile la fiecare restart.
    options.SigningKey = "dev-only-signing-key-change-me-please-32bytes+";
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();

builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((bearer, jwtOptions) =>
    {
        var jwt = jwtOptions.Value;

        bearer.RequireHttpsMetadata = !isDevelopment;
        bearer.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

// Fallback authorization: orice endpoint nedecorat cere autentificare.
// Endpoint-urile publice sunt marcate explicit cu [AllowAnonymous] (plan §7).
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// ---- Rate limiting (built-in .NET 8) ----------------------------------------
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Login: 5 încercări / 15 min / IP (plan §5).
    options.AddPolicy("login", context => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(15),
            QueueLimit = 0,
        }));

    // Formulare publice: 3 / oră / IP (plan §10).
    options.AddPolicy("public-forms", context => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 3,
            Window = TimeSpan.FromHours(1),
            QueueLimit = 0,
        }));
});

// ---- CORS — originile din configurație, nu hardcodate (plan §9.5) -----------
var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? string.Empty)
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options => options.AddPolicy("Client", policy =>
{
    if (allowedOrigins.Length > 0)
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    }
}));

var app = builder.Build();

// ---- Migrations + seed ------------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await scope.ServiceProvider.GetRequiredService<DbSeeder>().SeedAsync();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseStaticFiles();          // /uploads
app.UseCors("Client");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SPA fallback — refresh pe /blog/articol nu trebuie să dea 404 (plan §12).
// Se aplică doar dacă build-ul clientului a fost copiat în wwwroot.
if (File.Exists(Path.Combine(app.Environment.WebRootPath ?? string.Empty, "index.html")))
{
    app.MapFallbackToFile("index.html").AllowAnonymous();
}

app.Run();

/// <summary>
/// Clasa Program generată din instrucțiunile de nivel superior este implicit internă;
/// o expunem ca publică pentru <c>WebApplicationFactory&lt;Program&gt;</c> din testele de integrare.
/// </summary>
public partial class Program { }
