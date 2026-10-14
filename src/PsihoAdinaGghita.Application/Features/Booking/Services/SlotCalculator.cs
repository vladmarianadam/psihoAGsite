using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Booking.Services;

/// <summary>Un slot liber: capetele în UTC, plus data și ora locală pentru afișare.</summary>
public record BookingSlot(DateTime StartUtc, DateTime EndUtc, DateOnly LocalDate, TimeOnly LocalTime);

/// <summary>
/// Motorul de sloturi — funcție pură (fără DB, fără ceas), testată în SlotCalculatorTests.
/// Toată aritmetica locală trece prin fusul orar din setări, deci schimbarea orei (DST) e tratată.
/// </summary>
public static class SlotCalculator
{
    public static DateOnly LocalToday(DateTime nowUtc, TimeZoneInfo timeZone) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc), timeZone));

    /// <summary>Ora locală → UTC; null dacă ora nu există (golul de la trecerea la ora de vară).</summary>
    public static DateTime? ToUtc(DateOnly date, TimeOnly time, TimeZoneInfo timeZone)
    {
        var local = date.ToDateTime(time, DateTimeKind.Unspecified);
        return timeZone.IsInvalidTime(local) ? null : TimeZoneInfo.ConvertTimeToUtc(local, timeZone);
    }

    public static List<BookingSlot> Calculate(
        BookingSettings settings,
        IEnumerable<AvailabilityRule> rules,
        IEnumerable<AvailabilityException> exceptions,
        IEnumerable<(DateTime Start, DateTime End)> busy,
        int durationMinutes,
        DateOnly from,
        DateOnly to,
        DateTime nowUtc)
    {
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(settings.TimeZone);
        var duration = TimeSpan.FromMinutes(durationMinutes);
        var buffer = TimeSpan.FromMinutes(settings.BufferMinutes);
        var step = TimeSpan.FromMinutes(Math.Max(1, settings.SlotStepMinutes));
        var earliestStart = nowUtc + TimeSpan.FromHours(settings.MinNoticeHours);
        var lastDate = LocalToday(nowUtc, timeZone).AddDays(settings.HorizonDays);

        var rulesByDay = rules.ToLookup(r => r.DayOfWeek);
        var exceptionsByDate = exceptions.ToLookup(e => e.Date);
        var busyList = busy.ToList();
        var slots = new List<BookingSlot>();

        for (var date = from; date <= to && date <= lastDate; date = date.AddDays(1))
        {
            var dayExceptions = exceptionsByDate[date].ToList();
            if (dayExceptions.Any(e => e.IsClosed))
                continue;

            // Excepțiile deschise ale zilei ÎNLOCUIESC programul săptămânal.
            var intervals = dayExceptions.Count > 0
                ? dayExceptions
                    .Where(e => e.StartTime.HasValue && e.EndTime.HasValue)
                    .Select(e => (Start: e.StartTime!.Value, End: e.EndTime!.Value))
                    .ToList()
                : rulesByDay[date.DayOfWeek].Select(r => (Start: r.StartTime, End: r.EndTime)).ToList();

            foreach (var (intervalStart, intervalEnd) in intervals)
            {
                var intervalEndLocal = date.ToDateTime(intervalEnd);

                for (var local = date.ToDateTime(intervalStart); local + duration <= intervalEndLocal; local += step)
                {
                    var startUtc = ToUtc(date, TimeOnly.FromDateTime(local), timeZone);
                    if (startUtc is null || startUtc.Value < earliestStart)
                        continue;

                    var endUtc = startUtc.Value + duration;
                    var blockStart = startUtc.Value - buffer;
                    var blockEnd = endUtc + buffer;

                    if (busyList.Any(b => blockStart < b.End && b.Start < blockEnd))
                        continue;

                    slots.Add(new BookingSlot(
                        DateTime.SpecifyKind(startUtc.Value, DateTimeKind.Utc),
                        DateTime.SpecifyKind(endUtc, DateTimeKind.Utc),
                        date,
                        TimeOnly.FromDateTime(local)));
                }
            }
        }

        // Intervalele de excepție se pot suprapune — un slot apare o singură dată.
        return slots.DistinctBy(s => s.StartUtc).OrderBy(s => s.StartUtc).ToList();
    }
}
