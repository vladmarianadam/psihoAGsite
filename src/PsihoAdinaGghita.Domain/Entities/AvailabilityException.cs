using PsihoAdinaGghita.Domain.Common;

namespace PsihoAdinaGghita.Domain.Entities;

/// <summary>
/// Excepție pentru o singură zi. <see cref="IsClosed"/> = zi liberă (concediu); altfel
/// intervalul StartTime–EndTime înlocuiește programul săptămânal pentru acea zi.
/// Mai multe excepții deschise în aceeași zi se cumulează.
/// </summary>
public class AvailabilityException : BaseEntity
{
    public DateOnly Date { get; set; }
    public bool IsClosed { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? Reason { get; set; }
}
