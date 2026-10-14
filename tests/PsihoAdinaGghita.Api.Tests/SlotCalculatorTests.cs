using PsihoAdinaGghita.Application.Features.Booking.Services;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Api.Tests;

/// <summary>Motorul de sloturi e pur — fără API, fără DB. Europe/Bucharest: UTC+2 iarna, UTC+3 vara.</summary>
public class SlotCalculatorTests
{
    // Luni, 19.10.2026 (ora de vară, UTC+3).
    private static readonly DateOnly Monday = new(2026, 10, 19);
    private static readonly DateTime LongBefore = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private static BookingSettings Settings(int step = 30, int buffer = 0, int noticeHours = 0, int horizon = 365) => new()
    {
        SlotStepMinutes = step,
        BufferMinutes = buffer,
        MinNoticeHours = noticeHours,
        HorizonDays = horizon,
    };

    private static AvailabilityRule Rule(DayOfWeek day, int startHour, int endHour) =>
        new() { DayOfWeek = day, StartTime = new TimeOnly(startHour, 0), EndTime = new TimeOnly(endHour, 0) };

    private static List<BookingSlot> Calc(
        BookingSettings settings,
        IEnumerable<AvailabilityRule> rules,
        DateOnly day,
        DateTime now,
        int duration = 50,
        IEnumerable<AvailabilityException>? exceptions = null,
        IEnumerable<(DateTime, DateTime)>? busy = null) =>
        SlotCalculator.Calculate(settings, rules, exceptions ?? [], busy ?? [], duration, day, day, now);

    private static string[] LocalTimes(IEnumerable<BookingSlot> slots) =>
        slots.Select(s => s.LocalTime.ToString("HH:mm")).ToArray();

    [Fact]
    public void Imparte_intervalul_in_sloturi_care_incap_si_le_intoarce_in_UTC()
    {
        var slots = Calc(Settings(), [Rule(DayOfWeek.Monday, 10, 12)], Monday, LongBefore);

        Assert.Equal(["10:00", "10:30", "11:00"], LocalTimes(slots));
        Assert.Equal(new DateTime(2026, 10, 19, 7, 0, 0, DateTimeKind.Utc), slots[0].StartUtc);
        Assert.Equal(DateTimeKind.Utc, slots[0].StartUtc.Kind);
        Assert.Equal(slots[0].StartUtc.AddMinutes(50), slots[0].EndUtc);
    }

    [Fact]
    public void Bufferul_elimina_sloturile_lipite_de_o_programare_existenta()
    {
        // Ocupat 11:00–11:50 local = 08:00–08:50 UTC.
        var busy = new[] { (new DateTime(2026, 10, 19, 8, 0, 0), new DateTime(2026, 10, 19, 8, 50, 0)) };

        var withoutBuffer = LocalTimes(Calc(Settings(step: 10), [Rule(DayOfWeek.Monday, 10, 13)], Monday, LongBefore, busy: busy));
        var withBuffer = LocalTimes(Calc(Settings(step: 10, buffer: 10), [Rule(DayOfWeek.Monday, 10, 13)], Monday, LongBefore, busy: busy));

        // Fără buffer, 10:10 (se termină la 11:00) și 11:50 (începe la final) sunt libere.
        Assert.Contains("10:10", withoutBuffer);
        Assert.Contains("11:50", withoutBuffer);

        // Cu 10 minute de pauză, ele cad; 10:00 și 12:00 rămân.
        Assert.DoesNotContain("10:10", withBuffer);
        Assert.DoesNotContain("11:50", withBuffer);
        Assert.Contains("10:00", withBuffer);
        Assert.Contains("12:00", withBuffer);
        Assert.DoesNotContain("11:00", withBuffer);
    }

    [Fact]
    public void Preavizul_minim_elimina_sloturile_prea_apropiate()
    {
        // now + 24h = luni 10:15 local (07:15 UTC).
        var now = new DateTime(2026, 10, 18, 7, 15, 0, DateTimeKind.Utc);

        var slots = Calc(Settings(noticeHours: 24), [Rule(DayOfWeek.Monday, 10, 12)], Monday, now);

        Assert.Equal(["10:30", "11:00"], LocalTimes(slots));
    }

    [Fact]
    public void Ziua_dupa_orizont_nu_are_sloturi()
    {
        var now = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc);

        Assert.Empty(Calc(Settings(horizon: 5), [Rule(DayOfWeek.Monday, 10, 12)], Monday, now));
        Assert.NotEmpty(Calc(Settings(horizon: 9), [Rule(DayOfWeek.Monday, 10, 12)], Monday, now));
    }

    [Fact]
    public void Exceptiile_inchid_ziua_sau_inlocuiesc_programul()
    {
        var rules = new[] { Rule(DayOfWeek.Monday, 10, 12) };
        var closed = new AvailabilityException { Date = Monday, IsClosed = true };
        var open = new AvailabilityException { Date = Monday, StartTime = new TimeOnly(15, 0), EndTime = new TimeOnly(16, 0) };

        Assert.Empty(Calc(Settings(), rules, Monday, LongBefore, exceptions: [closed, open]));
        Assert.Equal(["15:00"], LocalTimes(Calc(Settings(), rules, Monday, LongBefore, exceptions: [open])));
    }

    [Fact]
    public void Ziua_trecerii_la_ora_de_vara_sare_peste_ora_inexistenta()
    {
        // Duminică 29.03.2026: la 03:00 ceasul sare la 04:00 (UTC+2 → UTC+3).
        var dstDay = new DateOnly(2026, 3, 29);

        var slots = Calc(Settings(step: 60), [Rule(DayOfWeek.Sunday, 1, 6)], dstDay, LongBefore, duration: 60);

        Assert.Equal(["01:00", "02:00", "04:00", "05:00"], LocalTimes(slots));
        Assert.Equal(
            [
                new DateTime(2026, 3, 28, 23, 0, 0),
                new DateTime(2026, 3, 29, 0, 0, 0),
                new DateTime(2026, 3, 29, 1, 0, 0),
                new DateTime(2026, 3, 29, 2, 0, 0),
            ],
            slots.Select(s => s.StartUtc).ToArray());
    }

    [Fact]
    public void Ics_are_CRLF_UTC_si_textul_escapat()
    {
        var ics = IcsBuilder.Build(
            7, "Ședință; test, 1", "linia 1\nlinia 2",
            new DateTime(2026, 10, 19, 7, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 10, 19, 7, 50, 0, DateTimeKind.Utc),
            new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc));

        Assert.Contains("UID:appointment-7@adinagghita.ro\r\n", ics);
        Assert.Contains("DTSTART:20261019T070000Z\r\n", ics);
        Assert.Contains("DTEND:20261019T075000Z\r\n", ics);
        Assert.Contains("SUMMARY:Ședință\\; test\\, 1\r\n", ics);
        Assert.Contains("DESCRIPTION:linia 1\\nlinia 2\r\n", ics);
        Assert.DoesNotContain("\n", ics.Replace("\r\n", ""));
    }
}
