using System.Net;
using System.Net.Http.Json;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Api.Tests;

/// <summary>
/// Fluxul public /programare. Politica "public-forms" permite 3 POST-uri/oră/IP pe fabrică,
/// deci clasa face exact 3: rezervare, aceeași oră din nou, honeypot.
/// </summary>
public class BookingFlowTests : IClassFixture<PsihoApiFactory>
{
    private readonly PsihoApiFactory _factory;

    public BookingFlowTests(PsihoApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Slotul_liber_se_rezerva_iar_a_doua_rezervare_pe_aceeasi_ora_primeste_409()
    {
        var client = _factory.CreateClient();
        var service = FirstBookableService();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var slots = await client.GetFromJsonAsync<SlotsResponse>(
            $"/api/booking/slots?from={today:yyyy-MM-dd}&to={today.AddDays(14):yyyy-MM-dd}&serviceId={service.Id}");

        Assert.NotNull(slots);
        Assert.True(slots!.IsEnabled);
        var slot = slots.Days.First(d => d.Slots.Count > 0).Slots[0];
        Assert.EndsWith("Z", slot.StartAt);

        var first = await client.PostAsJsonAsync("/api/booking", Booking(service, slot.StartAt, "ana@test.local"));
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var id = (await first.Content.ReadFromJsonAsync<IdResponse>())!.Id;
        var saved = _factory.WithDb(db => db.AppointmentRequests.Single(a => a.Id == id));
        Assert.Equal(AppointmentStatus.Pending, saved.Status);
        Assert.Equal(DateTime.Parse(slot.StartAt).ToUniversalTime(), DateTime.SpecifyKind(saved.StartAt!.Value, DateTimeKind.Utc));

        var second = await client.PostAsJsonAsync("/api/booking", Booking(service, slot.StartAt, "ion@test.local"));
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Rezervarea_cu_honeypot_intoarce_200_cu_id_0_si_nu_se_salveaza()
    {
        var service = FirstBookableService();
        var before = _factory.WithDb(db => db.AppointmentRequests.Count());

        var response = await _factory.CreateClient().PostAsJsonAsync("/api/booking",
            Booking(service, DateTime.UtcNow.AddDays(3).ToString("O"), "bot@spam.example") with { Honeypot = "http://spam.example" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(0, (await response.Content.ReadFromJsonAsync<IdResponse>())!.Id);
        Assert.Equal(before, _factory.WithDb(db => db.AppointmentRequests.Count()));
    }

    private (int Id, SessionMode Mode) FirstBookableService() => _factory.WithDb(db => db.Services
        .Where(s => s.IsActive && s.DurationMinutes > 0)
        .OrderBy(s => s.Id)
        .Select(s => new { s.Id, s.SessionMode })
        .AsEnumerable()
        .Select(s => (s.Id, s.SessionMode))
        .First());

    private static BookingBody Booking((int Id, SessionMode Mode) service, string startAt, string email) => new(
        service.Id,
        startAt,
        service.Mode == SessionMode.Online ? "Online" : "Cabinet",
        "Client Test",
        email,
        "+40 700 000 000",
        null,
        true,
        null);

    private record BookingBody(
        int ServiceId, string StartAt, string Mode, string FullName, string Email, string Phone,
        string? Message, bool GdprConsent, string? Honeypot);

    private record SlotsResponse(bool IsEnabled, List<DayResponse> Days);

    private record DayResponse(string Date, List<SlotResponse> Slots);

    private record SlotResponse(string StartAt, string EndAt, string LocalTime);

    private record IdResponse(int Id);
}
