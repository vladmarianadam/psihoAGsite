namespace PsihoAdinaGghita.Domain.Enums;

/// <summary>
/// Starea unei programări. <see cref="Legacy"/> marchează cererile vechi, fără oră fixă,
/// trimise din formularul text-liber de dinaintea selectorului de sloturi.
/// </summary>
public enum AppointmentStatus
{
    Pending = 0,
    Confirmed = 1,
    Rejected = 2,
    Cancelled = 3,
    Legacy = 4,
}
