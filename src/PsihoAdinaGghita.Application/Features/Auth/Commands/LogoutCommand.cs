using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;

namespace PsihoAdinaGghita.Application.Features.Auth.Commands;

public record LogoutCommand(int UserId) : IRequest<Unit>;

public class LogoutCommandValidator : AbstractValidator<LogoutCommand>
{
    public LogoutCommandValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0).WithMessage("Identificatorul utilizatorului este invalid.");
    }
}

/// <summary>Invalidează refresh tokenul stocat, deci sesiunea nu mai poate fi reîmprospătată (plan §7).</summary>
public class LogoutCommandHandler : IRequestHandler<LogoutCommand, Unit>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _dateTime;

    public LogoutCommandHandler(IAppDbContext db, IDateTimeProvider dateTime)
    {
        _db = db;
        _dateTime = dateTime;
    }

    public async Task<Unit> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.AdminUsers
            .FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken);

        // Delogarea este idempotentă: dacă userul nu mai există, cookie-ul este oricum șters de controller.
        if (user is null)
            return Unit.Value;

        user.RefreshTokenHash = null;
        user.RefreshTokenExpiresAt = null;
        user.UpdatedAt = _dateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
