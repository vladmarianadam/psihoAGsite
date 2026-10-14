namespace PsihoAdinaGghita.Domain.Enums;

/// <summary>Starea sincronizării cu Google Calendar a unei programări confirmate.</summary>
public enum SyncState
{
    NotNeeded = 0,
    Pending = 1,
    Synced = 2,
    Failed = 3,
}
