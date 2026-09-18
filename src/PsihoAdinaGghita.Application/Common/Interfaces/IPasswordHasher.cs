namespace PsihoAdinaGghita.Application.Common.Interfaces;

public interface IPasswordHasher
{
    /// <summary>BCrypt, work factor 12 (plan §10).</summary>
    string Hash(string password);

    bool Verify(string password, string passwordHash);
}
