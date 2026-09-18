using System.Net.Http.Json;

namespace PsihoAdinaGghita.Api.Tests;

/// <summary>
/// Câmpul-capcană (plan §8, faza 4): un bot care completează câmpul ascuns primește
/// un răspuns aparent de succes, dar nimic nu se salvează.
/// </summary>
public class HoneypotTests : IClassFixture<PsihoApiFactory>
{
    private readonly PsihoApiFactory _factory;

    public HoneypotTests(PsihoApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Cererea_cu_honeypot_completat_nu_se_salveaza()
    {
        var client = _factory.CreateClient();
        var before = _factory.WithDb(db => db.AppointmentRequests.Count());

        var response = await client.PostAsJsonAsync("/api/appointments", new
        {
            fullName = "Bot Spam",
            email = "bot@spam.example",
            phone = "+40 700 000 000",
            preferredMode = "Cabinet",
            gdprConsent = true,
            honeypot = "http://link-de-spam.example",
        });

        response.EnsureSuccessStatusCode();

        var after = _factory.WithDb(db => db.AppointmentRequests.Count());

        Assert.Equal(before, after);
        Assert.False(_factory.WithDb(db => db.AppointmentRequests.Any(a => a.Email == "bot@spam.example")));
    }
}
