using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Domain.Entities;
using PsihoAdinaGghita.Infrastructure.Options;

namespace PsihoAdinaGghita.Infrastructure.Identity;

/// <summary>
/// Emite access tokenuri JWT semnate HMAC-SHA256 și refresh tokenuri opace (plan §7, §10).
/// </summary>
public class JwtTokenService : IJwtTokenService
{
    private const int RefreshTokenByteLength = 32;
    private const int MinimumSigningKeyBytes = 32;

    private readonly JwtOptions _options;
    private readonly SigningCredentials _signingCredentials;
    private readonly JwtSecurityTokenHandler _tokenHandler = new();

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;

        var keyBytes = Encoding.UTF8.GetBytes(_options.SigningKey ?? string.Empty);
        if (keyBytes.Length < MinimumSigningKeyBytes)
        {
            throw new InvalidOperationException(
                $"Jwt:SigningKey lipsește sau are doar {keyBytes.Length} bytes; sunt necesari minim " +
                $"{MinimumSigningKeyBytes} bytes pentru HMAC-SHA256. Configurează cheia prin User Secrets " +
                "(dezvoltare) sau variabilă de mediu (producție).");
        }

        _signingCredentials = new SigningCredentials(
            new SymmetricSecurityKey(keyBytes),
            SecurityAlgorithms.HmacSha256);
    }

    public TimeSpan AccessTokenLifetime =>
        TimeSpan.FromMinutes(_options.AccessTokenMinutes > 0 ? _options.AccessTokenMinutes : 15);

    public TimeSpan RefreshTokenLifetime =>
        TimeSpan.FromDays(_options.RefreshTokenDays > 0 ? _options.RefreshTokenDays : 7);

    public string CreateAccessToken(AdminUser user)
    {
        ArgumentNullException.ThrowIfNull(user);

        var issuedAt = DateTime.UtcNow;
        var userId = user.Id.ToString();

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId),
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Name, user.Username),
            new("fullName", user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: issuedAt,
            expires: issuedAt.Add(AccessTokenLifetime),
            signingCredentials: _signingCredentials);

        return _tokenHandler.WriteToken(token);
    }

    public (string token, string tokenHash) CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(RefreshTokenByteLength);
        var token = ToBase64Url(bytes);
        return (token, HashRefreshToken(token));
    }

    /// <summary>SHA-256 hex minuscul — determinist, comparabil cu <c>AdminUser.RefreshTokenHash</c>.</summary>
    public string HashRefreshToken(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token ?? string.Empty));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    /// <summary>base64url fără padding: fără <c>=</c>, <c>+</c> sau <c>/</c>.</summary>
    private static string ToBase64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
}
