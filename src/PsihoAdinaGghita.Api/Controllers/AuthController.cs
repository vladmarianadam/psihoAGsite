using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Features.Auth.Commands;
using PsihoAdinaGghita.Application.Features.Auth.Dtos;
using PsihoAdinaGghita.Application.Features.Auth.Queries;

namespace PsihoAdinaGghita.Api.Controllers;

/// <summary>
/// Autentificare pentru zona de management. Access tokenul ajunge în corpul răspunsului (SPA îl
/// ține în memorie), iar refresh tokenul numai în cookie HttpOnly (plan §7, §10).
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const string RefreshCookieName = "psiho_refresh";

    private readonly ISender _sender;
    private readonly IWebHostEnvironment _environment;

    public AuthController(ISender sender, IWebHostEnvironment environment)
    {
        _sender = sender;
        _environment = environment;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AuthResultDto>> Login(LoginCommand command, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        SetRefreshCookie(result.RefreshToken, result.RefreshTokenExpiresAtUtc);
        return Ok(result.Auth);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResultDto>> Refresh(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies[RefreshCookieName];
        if (string.IsNullOrWhiteSpace(refreshToken))
            throw new AuthenticationFailedException("Sesiunea a expirat. Autentifică-te din nou.");

        var result = await _sender.Send(new RefreshTokenCommand(refreshToken), cancellationToken);

        // Rotație: cookie-ul este rescris cu tokenul nou.
        SetRefreshCookie(result.RefreshToken, result.RefreshTokenExpiresAtUtc);
        return Ok(result.Auth);
    }

    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await _sender.Send(new LogoutCommand(CurrentUserId()), cancellationToken);
        DeleteRefreshCookie();
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(CurrentUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CurrentUserDto>> Me(CancellationToken cancellationToken)
    {
        var user = await _sender.Send(new GetCurrentUserQuery(CurrentUserId()), cancellationToken);
        return Ok(user);
    }

    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        await _sender.Send(
            new ChangePasswordCommand(CurrentUserId(), request.CurrentPassword, request.NewPassword),
            cancellationToken);

        // Refresh tokenul a fost invalidat în handler; cookie-ul rămas ar fi inutil.
        DeleteRefreshCookie();
        return NoContent();
    }

    /// <summary>Id-ul utilizatorului din access token — Application nu are acces la HttpContext.</summary>
    private int CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(claim, out var userId))
            throw new UnauthorizedAccessException("Tokenul nu conține un identificator valid de utilizator.");

        return userId;
    }

    private CookieOptions RefreshCookieOptions(DateTimeOffset? expiresAtUtc = null) => new()
    {
        HttpOnly = true,
        // În dezvoltare API-ul rulează pe http://localhost, unde un cookie Secure nu ar fi trimis.
        Secure = !_environment.IsDevelopment(),
        SameSite = SameSiteMode.Strict,
        Path = "/api/auth",
        Expires = expiresAtUtc,
    };

    private void SetRefreshCookie(string refreshToken, DateTime expiresAtUtc)
    {
        var expires = new DateTimeOffset(DateTime.SpecifyKind(expiresAtUtc, DateTimeKind.Utc));
        Response.Cookies.Append(RefreshCookieName, refreshToken, RefreshCookieOptions(expires));
    }

    private void DeleteRefreshCookie() =>
        Response.Cookies.Delete(RefreshCookieName, RefreshCookieOptions());
}
