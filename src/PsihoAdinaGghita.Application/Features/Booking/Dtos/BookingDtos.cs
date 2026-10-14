namespace PsihoAdinaGghita.Application.Features.Booking.Dtos;

/// <summary>Un slot liber; StartAt/EndAt în UTC, LocalTime „HH:mm” în ora României.</summary>
public record BookingSlotDto(DateTime StartAt, DateTime EndAt, string LocalTime);

public record BookingDayDto(DateOnly Date, IReadOnlyList<BookingSlotDto> Slots);

/// <summary>Zilele fără sloturi sunt omise. Cu programările suspendate: IsEnabled = false și Days gol.</summary>
public record BookingSlotsDto(bool IsEnabled, string TimeZone, DateOnly LastBookableDate, IReadOnlyList<BookingDayDto> Days);
