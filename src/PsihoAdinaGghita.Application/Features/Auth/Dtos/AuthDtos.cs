using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Auth.Dtos;

/// <summary>Datele utilizatorului autentificat expuse clientului (fără hash-uri, fără tokenuri).</summary>
public record CurrentUserDto(
    int Id,
    string Username,
    string FullName,
    bool MustChangePassword,
    DateTime? LastLoginAt)
{
    public static CurrentUserDto FromEntity(AdminUser user) => new(
        user.Id,
        user.Username,
        user.FullName,
        user.MustChangePassword,
        user.LastLoginAt);
}

/// <summary>
/// Răspunsul trimis clientului la login/refresh. Access tokenul este ținut în memorie de SPA,
/// iar refresh tokenul <b>nu</b> apare aici — ajunge doar în cookie HttpOnly (plan §7, §10).
/// </summary>
public record AuthResultDto(
    string AccessToken,
    DateTime ExpiresAtUtc,
    CurrentUserDto User);

/// <summary>
/// Rezultatul intern al comenzilor de login/refresh: pe lângă răspunsul public conține refresh
/// tokenul în clar, pe care numai controllerul îl folosește, pentru a-l scrie în cookie.
/// </summary>
public record LoginResult(
    AuthResultDto Auth,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc);

/// <summary>
/// Corpul cererii de schimbare a parolei. Id-ul utilizatorului nu vine din corp, ci din tokenul
/// JWT (Application nu are acces la HttpContext).
/// </summary>
public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);
