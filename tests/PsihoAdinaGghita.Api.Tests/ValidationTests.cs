using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace PsihoAdinaGghita.Api.Tests;

/// <summary>
/// Testul cerut explicit de plan §5: în proiectul de referință validatorii FluentValidation
/// existau, dar nu erau înregistrați, deci nu rulau niciodată. Aceste teste confirmă că
/// pipeline-ul de validare este activ și că erorile ajung la client pe câmpuri.
/// Atenție: politica "public-forms" permite 3 cereri/oră/IP, deci clasa face exact 3 POST-uri.
/// </summary>
public class ValidationTests : IClassFixture<PsihoApiFactory>
{
    private readonly PsihoApiFactory _factory;

    public ValidationTests(PsihoApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Cerere_de_programare_invalida_intoarce_400_cu_erori_pe_campuri()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/appointments", new
        {
            fullName = "",
            email = "nu-este-email",
            phone = "12",
            preferredMode = "Cabinet",
            gdprConsent = false,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var errors = problem.RootElement.GetProperty("errors");

        // Fiecare regulă încălcată trebuie raportată separat, ca formularul să le poată afișa.
        Assert.True(errors.TryGetProperty("FullName", out _));
        Assert.True(errors.TryGetProperty("Email", out _));
        Assert.True(errors.TryGetProperty("Phone", out _));
        Assert.True(errors.TryGetProperty("GdprConsent", out _));
    }

    [Fact]
    public async Task Mesaj_de_contact_fara_consimtamant_GDPR_este_respins()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/contact", new
        {
            fullName = "Ana Ionescu",
            email = "ana@example.com",
            subject = "Întrebare",
            message = "Aș dori câteva informații despre ședințele online.",
            gdprConsent = false,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(problem.RootElement.GetProperty("errors").TryGetProperty("GdprConsent", out _));
    }

    [Fact]
    public async Task Cerere_de_programare_valida_este_salvata_in_baza_de_date()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/appointments", new
        {
            fullName = "Mihai Popa",
            email = "mihai.popa@example.com",
            phone = "+40 721 555 111",
            preferredMode = "Online",
            preferredTimeframe = "seara, după ora 18",
            message = "Aș dori o primă ședință.",
            gdprConsent = true,
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var saved = _factory.WithDb(db => db.AppointmentRequests
            .Any(a => a.Email == "mihai.popa@example.com" && a.GdprConsent));

        Assert.True(saved, "Cererea trebuie persistată în DB, nu doar trimisă pe email (plan §4).");
    }
}
