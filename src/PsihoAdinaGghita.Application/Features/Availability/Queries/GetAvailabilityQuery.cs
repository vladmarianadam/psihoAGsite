using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Availability.Dtos;
using PsihoAdinaGghita.Application.Features.Booking.Services;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Availability.Queries;

/// <summary>Tot ce afișează pagina Disponibilitate; excepțiile trecute nu se mai întorc.</summary>
public record GetAvailabilityQuery : IRequest<AvailabilityDto>;

public class GetAvailabilityQueryHandler : IRequestHandler<GetAvailabilityQuery, AvailabilityDto>
{
    private readonly IAppDbContext _db;
    private readonly ICalendarService _calendar;
    private readonly IDateTimeProvider _clock;

    public GetAvailabilityQueryHandler(IAppDbContext db, ICalendarService calendar, IDateTimeProvider clock)
    {
        _db = db;
        _calendar = calendar;
        _clock = clock;
    }

    public async Task<AvailabilityDto> Handle(GetAvailabilityQuery request, CancellationToken cancellationToken)
    {
        var s = await _db.BookingSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken)
            ?? new BookingSettings();

        var today = SlotCalculator.LocalToday(_clock.UtcNow, TimeZoneInfo.FindSystemTimeZoneById(s.TimeZone));

        var rules = await _db.AvailabilityRules.AsNoTracking()
            .OrderBy(r => r.DayOfWeek).ThenBy(r => r.StartTime)
            .Select(r => new AvailabilityRuleDto(r.Id, (int)r.DayOfWeek, r.StartTime, r.EndTime))
            .ToListAsync(cancellationToken);

        var exceptions = await _db.AvailabilityExceptions.AsNoTracking()
            .Where(e => e.Date >= today)
            .OrderBy(e => e.Date).ThenBy(e => e.StartTime)
            .Select(e => new AvailabilityExceptionDto(e.Id, e.Date, e.IsClosed, e.StartTime, e.EndTime, e.Reason))
            .ToListAsync(cancellationToken);

        var settings = new BookingSettingsDto(
            s.IsEnabled, s.SlotStepMinutes, s.BufferMinutes, s.MinNoticeHours, s.HorizonDays,
            s.MaxPendingPerEmail, s.UseGoogleFreeBusy, s.TimeZone, _calendar.IsEnabled);

        return new AvailabilityDto(settings, rules, exceptions);
    }
}
