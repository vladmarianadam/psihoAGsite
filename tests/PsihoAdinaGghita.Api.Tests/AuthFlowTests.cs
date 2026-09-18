using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using PsihoAdinaGghita.Application.Features.Auth.Dtos;

namespace PsihoAdinaGghita.Api.Tests;

/// <summary>
/// Politica "login" permite 5 încercări/15 min/IP, deci clasa face exact 2 apeluri de login.
/// </summary>
public class AuthFlowTests : IClassFixture<PsihoApiFactory>
{
    private readonly PsihoApiFactory _factory;

    public AuthFlowTests(PsihoApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Parola_greșita_intoarce_401_cu_mesaj_generic()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/login", new
        {
            username = PsihoApiFactory.AdminUsername,
            password = "parola-greșita",
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();

        // Fără enumerare de utilizatori: mesajul nu trebuie să spună dacă userul există.
        Assert.DoesNotContain("nu există", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("utilizator inexistent", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_reusit_intoarce_token_care_deschide_panoul_de_management()
    {
        var client = _factory.CreateClient();

        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            username = PsihoApiFactory.AdminUsername,
            password = PsihoApiFactory.AdminPassword,
        });

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);

        var auth = await login.Content.ReadFromJsonAsync<AuthResultDto>();
        Assert.NotNull(auth);
        Assert.False(string.IsNullOrWhiteSpace(auth!.AccessToken));
        Assert.True(auth.User.MustChangePassword, "Parola de seed trebuie schimbată la primul login (plan §7).");

        // Refresh tokenul circulă DOAR prin cookie HttpOnly, niciodată în corpul răspunsului.
        var rawBody = await login.Content.ReadAsStringAsync();
        Assert.DoesNotContain("refreshToken", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(login.Headers.GetValues("Set-Cookie"), c => c.Contains("psiho_refresh") && c.Contains("httponly", StringComparison.OrdinalIgnoreCase));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);

        var me = await client.GetAsync("/api/auth/me");
        var dashboard = await client.GetAsync("/api/admin/dashboard");
        var adminArticles = await client.GetAsync("/api/admin/articles");

        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        Assert.Equal(HttpStatusCode.OK, dashboard.StatusCode);
        Assert.Equal(HttpStatusCode.OK, adminArticles.StatusCode);
    }
}
