using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Domain.Enums;

namespace PsihoAdinaGghita.Application.Features.Booking.Services;

/// <summary>
/// Încarcă din DB (și opțional din Google FreeBusy) datele de care are nevoie SlotCalculator.
/// Folosit și la listarea sloturilor, și la re-verificarea slotului la trimiterea cererii.
/// </summary>
public static class BookingAvailability
{
    public static async Task<List<BookingSlot>> GetSlotsAsync(
        IAppDbContext db,
        ICalendarService calendar,
        BookingSettings settings,
        int durationMinutes,
        DateOnly from,
        DateOnly to,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(settings.TimeZone);

        // O zi în plus la ambele capete acoperă diferența de fus orar și bufferul.
        var rangeStartUtc = TimeZoneInfo.ConvertTimeToUtc(from.AddDays(-1).ToDateTime(TimeOnly.MinValue), timeZone);
        var rangeEndUtc = TimeZoneInfo.ConvertTimeToUtc(to.AddDays(2).ToDateTime(TimeOnly.MinValue), timeZone);

        var rules = await db.AvailabilityRules.AsNoTracking().ToListAsync(cancellationToken);
        var exceptions = await db.AvailabilityExceptions.AsNoTracking()
            .Where(e => e.Date >= from && e.Date <= to)
            .ToListAsync(cancellationToken);

        var booked = await db.AppointmentRequests.AsNoTracking()
            .Where(a => (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed)
                && a.StartAt != null && a.EndAt != null
                && a.StartAt < rangeEndUtc && a.EndAt > rangeStartUtc)
            .Select(a => new { Start = a.StartAt!.Value, End = a.EndAt!.Value })
            .ToListAsync(cancellationToken);

        var busy = booked.Select(b => (b.Start, b.End)).ToList();

        if (settings.UseGoogleFreeBusy && calendar.IsEnabled)
            busy.AddRange(await calendar.GetBusyAsync(rangeStartUtc, rangeEndUtc, cancellationToken));

        return SlotCalculator.Calculate(settings, rules, exceptions, busy, durationMinutes, from, to, nowUtc);
    }
}
