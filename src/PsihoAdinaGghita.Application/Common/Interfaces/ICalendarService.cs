namespace PsihoAdinaGghita.Application.Common.Interfaces;

/// <summary>Eveniment de calendar; orele sunt în UTC.</summary>
public record CalendarEventRequest(string Summary, string Description, DateTime StartUtc, DateTime EndUtc);

/// <summary>
/// Google Calendar din spatele unei abstracții, ca Application să nu cunoască SDK-ul.
/// Implementarea nu aruncă pentru erori de rețea/API: CreateEventAsync întoarce null,
/// iar handlerul marchează sincronizarea ca Failed.
/// </summary>
public interface ICalendarService
{
    /// <summary>False când GoogleCalendar:Enabled lipsește — programările rămân NotNeeded.</summary>
    bool IsEnabled { get; }

    Task<string?> CreateEventAsync(CalendarEventRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteEventAsync(string eventId, CancellationToken cancellationToken);

    /// <summary>Intervalele ocupate (UTC) din calendar; listă goală dacă e dezactivat sau eșuează.</summary>
    Task<IReadOnlyList<(DateTime Start, DateTime End)>> GetBusyAsync(DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken);
}
