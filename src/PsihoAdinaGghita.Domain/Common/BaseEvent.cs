namespace PsihoAdinaGghita.Domain.Common;

/// <summary>Clasă de bază pentru evenimente de domeniu.</summary>
public abstract class BaseEvent
{
    public DateTime OccurredOn { get; protected set; } = DateTime.UtcNow;
}
