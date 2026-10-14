using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Auth.Dtos;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Domain.Enums;
using PsihoAdinaGghita.Infrastructure.Persistence;

namespace PsihoAdinaGghita.Api.Tests;

/// <summary>
/// Confirmarea din panou cu un Google Calendar fals. Fiecare test își face propriul host
/// (WithWebHostBuilder), deci și propriul limitator de login.
/// </summary>
public class ApprovalTests : IClassFixture<PsihoApiFactory>
{
    private readonly PsihoApiFactory _factory;

    public ApprovalTests(PsihoApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Confirmarea_creeaza_evenimentul_si_marcheaza_Synced()
    {
        var calendar = new FakeCalendar { NextEventId = "evt-1" };
        var (factory, client) = await CreateAdminClientAsync(calendar);
        var id = AddPending(factory, DateTime.UtcNow.Date.AddDays(10).AddHours(8));

        var response = await client.PutAsync($"/api/admin/appointments/{id}/confirm", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var saved = Load(factory, id);
        Assert.Equal(AppointmentStatus.Confirmed, saved.Status);
        Assert.Equal(SyncState.Synced, saved.GoogleSyncState);
        Assert.Equal("evt-1", saved.GoogleEventId);
        Assert.True(saved.IsHandled);
        Assert.NotNull(saved.ConfirmedAt);

        // A doua confirmare și resincronizarea unui rând deja sincronizat sunt conflicte.
        Assert.Equal(HttpStatusCode.Conflict, (await client.PutAsync($"/api/admin/appointments/{id}/confirm", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsync($"/api/admin/appointments/{id}/resync", null)).StatusCode);
    }

    [Fact]
    public async Task Esecul_Google_marcheaza_Failed_iar_resincronizarea_il_repara()
    {
        var calendar = new FakeCalendar { NextEventId = null };
        var (factory, client) = await CreateAdminClientAsync(calendar);
        var id = AddPending(factory, DateTime.UtcNow.Date.AddDays(11).AddHours(8));

        var confirm = await client.PutAsync($"/api/admin/appointments/{id}/confirm", null);

        Assert.Equal(HttpStatusCode.NoContent, confirm.StatusCode);
        Assert.Equal(AppointmentStatus.Confirmed, Load(factory, id).Status);
        Assert.Equal(SyncState.Failed, Load(factory, id).GoogleSyncState);

        calendar.NextEventId = "evt-2";
        var resync = await client.PostAsync($"/api/admin/appointments/{id}/resync", null);

        Assert.Equal(HttpStatusCode.NoContent, resync.StatusCode);
        var saved = Load(factory, id);
        Assert.Equal(SyncState.Synced, saved.GoogleSyncState);
        Assert.Equal("evt-2", saved.GoogleEventId);
    }

    private async Task<(WebApplicationFactory<Program> Factory, HttpClient Client)> CreateAdminClientAsync(FakeCalendar calendar)
    {
        var factory = _factory.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services => services.AddSingleton<ICalendarService>(calendar)));
        var client = factory.CreateClient();

        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            username = PsihoApiFactory.AdminUsername,
            password = PsihoApiFactory.AdminPassword,
        });
        login.EnsureSuccessStatusCode();

        var auth = await login.Content.ReadFromJsonAsync<AuthResultDto>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        return (factory, client);
    }

    private static int AddPending(WebApplicationFactory<Program> factory, DateTime startUtc)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var entity = new AppointmentRequest
        {
            FullName = "Client Test",
            Email = "client@test.local",
            Phone = "+40 700 000 000",
            ServiceId = db.Services.OrderBy(s => s.Id).Select(s => s.Id).First(),
            PreferredMode = SessionMode.Cabinet,
            GdprConsent = true,
            Status = AppointmentStatus.Pending,
            StartAt = startUtc,
            EndAt = startUtc.AddMinutes(50),
        };

        db.AppointmentRequests.Add(entity);
        db.SaveChanges();
        return entity.Id;
    }

    private static AppointmentRequest Load(WebApplicationFactory<Program> factory, int id)
    {
        using var scope = factory.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<AppDbContext>().AppointmentRequests.Single(a => a.Id == id);
    }

    private sealed class FakeCalendar : ICalendarService
    {
        public string? NextEventId { get; set; }

        public bool IsEnabled => true;

        public Task<string?> CreateEventAsync(CalendarEventRequest request, CancellationToken cancellationToken) =>
            Task.FromResult(NextEventId);

        public Task<bool> DeleteEventAsync(string eventId, CancellationToken cancellationToken) => Task.FromResult(true);

        public Task<IReadOnlyList<(DateTime Start, DateTime End)>> GetBusyAsync(DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<(DateTime Start, DateTime End)>>([]);
    }
}
