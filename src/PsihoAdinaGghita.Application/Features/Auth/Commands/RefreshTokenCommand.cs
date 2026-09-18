using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Auth.Dtos;

namespace PsihoAdinaGghita.Application.Features.Auth.Commands;

public record RefreshTokenCommand(string RefreshToken) : IRequest<LoginResult>;

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Sesiunea a expirat. Autentifică-te din nou.")
            .MaximumLength(200).WithMessage("Sesiunea a expirat. Autentifică-te din nou.");
    }
}

/// <summary>
/// Reîmprospătează perechea de tokenuri. Rotația este obligatorie: refresh tokenul folosit devine
/// invalid imediat, fiind suprascris de cel nou (plan §7).
/// </summary>
public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, LoginResult>
{
    private const string SessionExpiredMessage = "Sesiunea a expirat. Autentifică-te din nou.";

    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _tokenService;
    private readonly IDateTimeProvider _dateTime;

    public RefreshTokenCommandHandler(
        IAppDbContext db,
        IJwtTokenService tokenService,
        IDateTimeProvider dateTime)
    {
        _db = db;
        _tokenService = tokenService;
        _dateTime = dateTime;
    }

    public async Task<LoginResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var now = _dateTime.UtcNow;

        // Se caută după hash — tokenul în clar nu există niciodată în baza de date.
        var tokenHash = _tokenService.HashRefreshToken(request.RefreshToken);

        var user = await _db.AdminUsers
            .FirstOrDefaultAsync(x => x.RefreshTokenHash == tokenHash, cancellationToken);

        if (user is null || user.RefreshTokenExpiresAt is null || user.RefreshTokenExpiresAt <= now)
            throw new AuthenticationFailedException(SessionExpiredMessage);

        // Un cont blocat nu își poate prelungi sesiunea.
        if (user.IsLockedOut(now))
            throw new AuthenticationFailedException(SessionExpiredMessage);

        var accessToken = _tokenService.CreateAccessToken(user);
        var (refreshToken, refreshTokenHash) = _tokenService.CreateRefreshToken();
        var refreshTokenExpiresAt = now.Add(_tokenService.RefreshTokenLifetime);

        user.RefreshTokenHash = refreshTokenHash;
        user.RefreshTokenExpiresAt = refreshTokenExpiresAt;
        user.UpdatedAt = now;

        await _db.SaveChangesAsync(cancellationToken);

        var auth = new AuthResultDto(
            accessToken,
            now.Add(_tokenService.AccessTokenLifetime),
            CurrentUserDto.FromEntity(user));

        return new LoginResult(auth, refreshToken, refreshTokenExpiresAt);
    }
}
