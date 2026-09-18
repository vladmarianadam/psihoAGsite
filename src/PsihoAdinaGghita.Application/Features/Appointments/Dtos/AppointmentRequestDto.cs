namespace PsihoAdinaGghita.Application.Features.Appointments.Dtos;

/// <summary>
/// Cerere de programare, așa cum e afișată în panoul de management (plan §4).
/// Conține date personale — nu se loghează niciodată (plan §10).
/// </summary>
public record AppointmentRequestDto(
    int Id,
    string FullName,
    string Email,
    string Phone,
    int? ServiceId,
    string? ServiceName,
    string PreferredMode,
    string? PreferredTimeframe,
    string? Message,
    bool IsHandled,
    string? Notes,
    DateTime CreatedAt);
