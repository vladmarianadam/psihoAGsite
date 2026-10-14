namespace PsihoAdinaGghita.Application.Features.Availability.Dtos;

/// <summary>TimeZone și GoogleCalendarConfigured sunt doar pentru citire.</summary>
public record BookingSettingsDto(
    bool IsEnabled,
    int SlotStepMinutes,
    int BufferMinutes,
    int MinNoticeHours,
    int HorizonDays,
    int MaxPendingPerEmail,
    bool UseGoogleFreeBusy,
    string TimeZone,
    bool GoogleCalendarConfigured);

/// <summary>DayOfWeek ca număr (0 = duminică … 6 = sâmbătă), nu ca text: enumurile circulă ca string în JSON.</summary>
public record AvailabilityRuleDto(int Id, int DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);

public record AvailabilityRuleInput(int DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);

public record AvailabilityExceptionDto(int Id, DateOnly Date, bool IsClosed, TimeOnly? StartTime, TimeOnly? EndTime, string? Reason);

public record AvailabilityDto(
    BookingSettingsDto Settings,
    IReadOnlyList<AvailabilityRuleDto> Rules,
    IReadOnlyList<AvailabilityExceptionDto> Exceptions);
