using System.Net;

namespace PsihoAdinaGghita.Api.Tests;

/// <summary>
/// Panoul de management este ascuns prin obscuritate, dar protejat prin autentificare
/// (plan §7). Aceste teste verifică stratul care contează efectiv.
/// </summary>
public class AuthorizationTests : IClassFixture<PsihoApiFactory>
{
    private readonly PsihoApiFactory _factory;

    public AuthorizationTests(PsihoApiFactory factory) => _factory = factory;

    [Theory]
    [InlineData("/api/admin/articles")]
    [InlineData("/api/admin/categories")]
    [InlineData("/api/admin/services")]
    [InlineData("/api/admin/testimonials")]
    [InlineData("/api/admin/faq")]
    [InlineData("/api/admin/appointments")]
    [InlineData("/api/admin/contact-messages")]
    [InlineData("/api/admin/media")]
    [InlineData("/api/admin/dashboard")]
    [InlineData("/api/auth/me")]
    public async Task Endpointurile_de_management_cer_autentificare(string url)
    {
        var response = await _factory.CreateClient().GetAsync(url);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Token_invalid_este_respins()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", "token.care.nu.este.valid");

        var response = await client.GetAsync("/api/admin/dashboard");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
