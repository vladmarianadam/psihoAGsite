using PsihoAdinaGghita.Domain.Common;

namespace PsihoAdinaGghita.Domain.Entities;

public class AdminUser : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTime? LastLoginAt { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockedUntil { get; set; }

    /// <summary>Seed-ul creează userul cu parolă temporară; schimbarea e obligatorie la primul login.</summary>
    public bool MustChangePassword { get; set; }

    public string? RefreshTokenHash { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }

    public bool IsLockedOut(DateTime utcNow) => LockedUntil.HasValue && LockedUntil.Value > utcNow;
}
