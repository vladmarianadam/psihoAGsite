using PsihoAdinaGghita.Domain.Common;

namespace PsihoAdinaGghita.Domain.Entities;

/// <summary>Setările programărilor online — un singur rând în tabel.</summary>
public class BookingSettings : BaseEntity
{
    public bool IsEnabled { get; set; } = true;
    public int SlotStepMinutes { get; set; } = 30;
    public int BufferMinutes { get; set; } = 10;
    public int MinNoticeHours { get; set; } = 24;
    public int HorizonDays { get; set; } = 60;
    public int MaxPendingPerEmail { get; set; } = 2;
    public bool UseGoogleFreeBusy { get; set; }
    public string TimeZone { get; set; } = "Europe/Bucharest";
}
