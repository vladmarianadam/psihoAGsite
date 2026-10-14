using PsihoAdinaGghita.Domain.Common;

namespace PsihoAdinaGghita.Domain.Entities;

/// <summary>Interval din programul săptămânal (ex. Luni 10:00–13:00), în ora României.</summary>
public class AvailabilityRule : BaseEntity
{
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}
