using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;

namespace PsihoAdinaGghita.Application.Features.Auth.Commands;

public record ChangePasswordCommand(int UserId, string CurrentPassword, string NewPassword) : IRequest<Unit>;

public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0).WithMessage("Identificatorul utilizatorului este invalid.");

        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Parola actuală este obligatorie.");

        // Politica de parolă din plan §10: minim 12 caractere, cu toate clasele de caractere.
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Parola nouă este obligatorie.")
            .MinimumLength(12).WithMessage("Parola nouă trebuie să aibă cel puțin 12 caractere.")
            .MaximumLength(72).WithMessage("Parola nouă poate avea maxim 72 de caractere.")
            .Matches("[a-z]").WithMessage("Parola nouă trebuie să conțină cel puțin o literă mică.")
            .Matches("[A-Z]").WithMessage("Parola nouă trebuie să conțină cel puțin o literă mare.")
            .Matches("[0-9]").WithMessage("Parola nouă trebuie să conțină cel puțin o cifră.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Parola nouă trebuie să conțină cel puțin un caracter special.")
            .NotEqual(x => x.CurrentPassword).WithMessage("Parola nouă trebuie să fie diferită de parola actuală.");
    }
}

/// <summary>
/// Schimbă parola, ridică obligația de schimbare de la primul login și invalidează refresh tokenul
/// existent, forțând re-autentificarea celorlalte sesiuni (plan §7).
/// </summary>
public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IDateTimeProvider _dateTime;

    public ChangePasswordCommandHandler(
        IAppDbContext db,
        IPasswordHasher passwordHasher,
        IDateTimeProvider dateTime)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _dateTime = dateTime;
    }

    public async Task<Unit> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.AdminUsers
            .FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken);

        // Tokenul indică un utilizator care nu mai există → sesiunea nu mai este validă.
        if (user is null)
            throw new AuthenticationFailedException();

        if (!_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            throw new AuthenticationFailedException("Parola actuală este incorectă.");

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        user.MustChangePassword = false;
        user.RefreshTokenHash = null;
        user.RefreshTokenExpiresAt = null;
        user.UpdatedAt = _dateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
