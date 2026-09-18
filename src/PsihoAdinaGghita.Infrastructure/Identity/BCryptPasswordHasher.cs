using PsihoAdinaGghita.Application.Common.Interfaces;

namespace PsihoAdinaGghita.Infrastructure.Identity;

/// <summary>BCrypt cu work factor 12 (plan §10).</summary>
public class BCryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;

    public string Hash(string password)
    {
        if (string.IsNullOrEmpty(password))
            throw new ArgumentException("Parola nu poate fi goală.", nameof(password));

        return global::BCrypt.Net.BCrypt.HashPassword(password, workFactor: WorkFactor);
    }

    /// <summary>Întoarce <c>false</c> (nu aruncă) pentru parolă goală sau hash invalid/corupt.</summary>
    public bool Verify(string password, string passwordHash)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrWhiteSpace(passwordHash))
            return false;

        try
        {
            return global::BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch (global::BCrypt.Net.SaltParseException)
        {
            return false;
        }
        catch (ArgumentException)
        {
            return false;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
