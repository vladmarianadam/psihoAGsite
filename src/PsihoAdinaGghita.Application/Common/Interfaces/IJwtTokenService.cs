using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Common.Interfaces;

public interface IJwtTokenService
{
    /// <summary>Access token semnat, valabil 15 minute (plan §7).</summary>
    string CreateAccessToken(AdminUser user);

    /// <summary>Refresh token opac (random 32 bytes, base64url) + hash-ul lui pentru stocare.</summary>
    (string token, string tokenHash) CreateRefreshToken();

    string HashRefreshToken(string token);

    TimeSpan AccessTokenLifetime { get; }
    TimeSpan RefreshTokenLifetime { get; }
}
