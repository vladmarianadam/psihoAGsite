using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Infrastructure.Options;

namespace PsihoAdinaGghita.Infrastructure.Calendar;

/// <summary>
/// Google Calendar prin cont de serviciu (singleton). Nu aruncă niciodată pentru erori Google:
/// întoarce null / false / listă goală și loghează, ca handlerele să marcheze sincronizarea Failed.
/// </summary>
public sealed class GoogleCalendarService : ICalendarService, IDisposable
{
    private static readonly TimeSpan BusyCacheDuration = TimeSpan.FromMinutes(2);

    private readonly GoogleCalendarOptions _options;
    private readonly IMemoryCache _cache;
    private readonly ILogger<GoogleCalendarService> _logger;
    private readonly Lazy<CalendarService?> _service;

    // Evenimentele create/șterse de noi schimbă FreeBusy; generația nouă ocolește cache-ul vechi.
    private int _busyGeneration;

    public GoogleCalendarService(
        IOptions<GoogleCalendarOptions> options,
        IMemoryCache cache,
        ILogger<GoogleCalendarService> logger)
    {
        _options = options.Value;
        _cache = cache;
        _logger = logger;
        _service = new Lazy<CalendarService?>(CreateService);
    }

    public bool IsEnabled =>
        _options.Enabled
        && !string.IsNullOrWhiteSpace(_options.CalendarId)
        && (!string.IsNullOrWhiteSpace(_options.ServiceAccountJson) || !string.IsNullOrWhiteSpace(_options.ServiceAccountJsonPath));

    public async Task<string?> CreateEventAsync(CalendarEventRequest request, CancellationToken cancellationToken)
    {
        if (!IsEnabled || _service.Value is not { } service)
            return null;

        try
        {
            var created = await service.Events.Insert(new Event
            {
                Summary = request.Summary,
                Description = request.Description,
                Start = new EventDateTime { DateTimeDateTimeOffset = new DateTimeOffset(request.StartUtc, TimeSpan.Zero) },
                End = new EventDateTime { DateTimeDateTimeOffset = new DateTimeOffset(request.EndUtc, TimeSpan.Zero) },
            }, _options.CalendarId).ExecuteAsync(cancellationToken);

            InvalidateBusyCache();
            return created.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google Calendar: crearea evenimentului a eșuat.");
            return null;
        }
    }

    public async Task<bool> DeleteEventAsync(string eventId, CancellationToken cancellationToken)
    {
        if (!IsEnabled || _service.Value is not { } service)
            return false;

        try
        {
            await service.Events.Delete(_options.CalendarId, eventId).ExecuteAsync(cancellationToken);
            InvalidateBusyCache();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google Calendar: ștergerea evenimentului {EventId} a eșuat.", eventId);
            return false;
        }
    }

    public async Task<IReadOnlyList<(DateTime Start, DateTime End)>> GetBusyAsync(
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken)
    {
        if (!IsEnabled || _service.Value is not { } service)
            return [];

        var key = $"gcal-busy:{_busyGeneration}:{fromUtc:O}:{toUtc:O}";
        if (_cache.TryGetValue(key, out IReadOnlyList<(DateTime, DateTime)>? cached) && cached is not null)
            return cached;

        try
        {
            var response = await service.Freebusy.Query(new FreeBusyRequest
            {
                TimeMinDateTimeOffset = new DateTimeOffset(DateTime.SpecifyKind(fromUtc, DateTimeKind.Utc)),
                TimeMaxDateTimeOffset = new DateTimeOffset(DateTime.SpecifyKind(toUtc, DateTimeKind.Utc)),
                Items = [new FreeBusyRequestItem { Id = _options.CalendarId }],
            }).ExecuteAsync(cancellationToken);

            IReadOnlyList<(DateTime, DateTime)> busy = response.Calendars is not null
                && response.Calendars.TryGetValue(_options.CalendarId, out var calendar)
                && calendar.Busy is not null
                    ? calendar.Busy
                        .Where(p => p.StartDateTimeOffset.HasValue && p.EndDateTimeOffset.HasValue)
                        .Select(p => (p.StartDateTimeOffset!.Value.UtcDateTime, p.EndDateTimeOffset!.Value.UtcDateTime))
                        .ToList()
                    : [];

            _cache.Set(key, busy, BusyCacheDuration);
            return busy;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google Calendar: interogarea FreeBusy a eșuat; sloturile se calculează fără ea.");
            return [];
        }
    }

    private void InvalidateBusyCache() => Interlocked.Increment(ref _busyGeneration);

    private CalendarService? CreateService()
    {
        try
        {
            var json = !string.IsNullOrWhiteSpace(_options.ServiceAccountJson)
                ? _options.ServiceAccountJson
                : File.ReadAllText(_options.ServiceAccountJsonPath);

            var credential = CredentialFactory.FromJson<ServiceAccountCredential>(json)
                .ToGoogleCredential()
                .CreateScoped(CalendarService.Scope.Calendar);

            return new CalendarService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "PsihoAdinaGghita",
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google Calendar: cheia contului de serviciu nu a putut fi încărcată.");
            return null;
        }
    }

    public void Dispose()
    {
        if (_service.IsValueCreated)
            _service.Value?.Dispose();
    }
}
