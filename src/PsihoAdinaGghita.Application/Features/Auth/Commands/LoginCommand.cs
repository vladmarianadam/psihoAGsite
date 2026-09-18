using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Auth.Dtos;

namespace PsihoAdinaGghita.Application.Features.Auth.Commands;

public record LoginCommand(string Username, string Password) : IRequest<LoginResult>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Numele de utilizator este obligatoriu.")
            .MaximumLength(50).WithMessage("Numele de utilizator poate avea maxim 50 de caractere.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Parola este obligatorie.")
            .MaximumLength(72).WithMessage("Parola poate avea maxim 72 de caractere.");
    }
}

/// <summary>
/// Autentificare cu mesaje generice (fără enumerare de utilizatori) și lockout după 5 încercări
/// eșuate, contorizat pe utilizator, complementar rate limiterului pe IP (plan §7).
/// </summary>
public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResult>
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _tokenService;
    private readonly IDateTimeProvider _dateTime;

    public LoginCommandHandler(
        IAppDbContext db,
        IPasswordHasher passwordHasher,
        IJwtTokenService tokenService,
        IDateTimeProvider dateTime)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _dateTime = dateTime;
    }

    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var username = request.Username.Trim().ToLowerInvariant();
        var now = _dateTime.UtcNow;

        // SQLite compară implicit binar, deci căutarea case-insensitive se face explicit.
        var user = await _db.AdminUsers
            .FirstOrDefaultAsync(x => x.Username.ToLower() == username, cancellationToken);

        // Același mesaj pentru utilizator inexistent și pentru parolă greșită (plan §7).
        if (user is null)
            throw new AuthenticationFailedException();

        if (user.IsLockedOut(now))
        {
            throw new AuthenticationFailedException(
                "Accesul este temporar blocat. Încearcă din nou mai târziu.");
        }

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= MaxFailedAttempts)
            {
                user.LockedUntil = now.Add(LockoutDuration);
                user.FailedLoginAttempts = 0;
            }

            user.UpdatedAt = now;
            await _db.SaveChangesAsync(cancellationToken);

            throw new AuthenticationFailedException();
        }

        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;
        user.LastLoginAt = now;

        var accessToken = _tokenService.CreateAccessToken(user);
        var (refreshToken, refreshTokenHash) = _tokenService.CreateRefreshToken();
        var refreshTokenExpiresAt = now.Add(_tokenService.RefreshTokenLifetime);

        // În baza de date ajunge numai hash-ul refresh tokenului (plan §10).
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
