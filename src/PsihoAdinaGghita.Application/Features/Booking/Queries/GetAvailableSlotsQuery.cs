using System.Globalization;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Booking.Dtos;
using PsihoAdinaGghita.Application.Features.Booking.Services;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Booking.Queries;

/// <summary>Sloturile libere între două date locale (inclusiv), pentru durata serviciului ales.</summary>
public record GetAvailableSlotsQuery(DateOnly From, DateOnly To, int ServiceId) : IRequest<BookingSlotsDto>;

public class GetAvailableSlotsQueryValidator : AbstractValidator<GetAvailableSlotsQuery>
{
    public const int MaxRangeDays = 62;

    private readonly IAppDbContext _db;

    public GetAvailableSlotsQueryValidator(IAppDbContext db)
    {
        _db = db;

        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From).WithMessage("Data de sfârșit trebuie să fie după data de început.")
            .Must((query, to) => to.DayNumber - query.From.DayNumber < MaxRangeDays)
            .WithMessage($"Intervalul poate avea maxim {MaxRangeDays} de zile.");

        RuleFor(x => x.ServiceId)
            .GreaterThan(0).WithMessage("Serviciul este obligatoriu.")
            .MustAsync(ServiceIsBookable).WithMessage("Serviciul selectat nu există sau nu este disponibil.");
    }

    private async Task<bool> ServiceIsBookable(int serviceId, CancellationToken cancellationToken) =>
        await _db.Services.AsNoTracking()
            .AnyAsync(s => s.Id == serviceId && s.IsActive && s.DurationMinutes > 0, cancellationToken);
}

public class GetAvailableSlotsQueryHandler : IRequestHandler<GetAvailableSlotsQuery, BookingSlotsDto>
{
    private readonly IAppDbContext _db;
    private readonly ICalendarService _calendar;
    private readonly IDateTimeProvider _clock;

    public GetAvailableSlotsQueryHandler(IAppDbContext db, ICalendarService calendar, IDateTimeProvider clock)
    {
        _db = db;
        _calendar = calendar;
        _clock = clock;
    }

    public async Task<BookingSlotsDto> Handle(GetAvailableSlotsQuery request, CancellationToken cancellationToken)
    {
        var settings = await _db.BookingSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken)
            ?? new BookingSettings();

        var now = _clock.UtcNow;
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(settings.TimeZone);
        var today = SlotCalculator.LocalToday(now, timeZone);
        var lastBookableDate = today.AddDays(settings.HorizonDays);

        if (!settings.IsEnabled)
            return new BookingSlotsDto(false, settings.TimeZone, lastBookableDate, []);

        var from = request.From < today ? today : request.From;
        var to = request.To > lastBookableDate ? lastBookableDate : request.To;
        if (from > to)
            return new BookingSlotsDto(true, settings.TimeZone, lastBookableDate, []);

        var duration = await _db.Services.AsNoTracking()
            .Where(s => s.Id == request.ServiceId)
            .Select(s => s.DurationMinutes)
            .FirstAsync(cancellationToken);

        var slots = await BookingAvailability.GetSlotsAsync(_db, _calendar, settings, duration, from, to, now, cancellationToken);

        var days = slots
            .GroupBy(s => s.LocalDate)
            .Select(g => new BookingDayDto(g.Key, g
                .Select(s => new BookingSlotDto(s.StartUtc, s.EndUtc, s.LocalTime.ToString("HH:mm", CultureInfo.InvariantCulture)))
                .ToList()))
            .ToList();

        return new BookingSlotsDto(true, settings.TimeZone, lastBookableDate, days);
    }
}
