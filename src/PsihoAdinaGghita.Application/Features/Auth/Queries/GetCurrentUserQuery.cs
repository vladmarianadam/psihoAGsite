using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Auth.Dtos;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Auth.Queries;

public record GetCurrentUserQuery(int UserId) : IRequest<CurrentUserDto>;

public class GetCurrentUserQueryValidator : AbstractValidator<GetCurrentUserQuery>
{
    public GetCurrentUserQueryValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0).WithMessage("Identificatorul utilizatorului este invalid.");
    }
}

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, CurrentUserDto>
{
    private readonly IAppDbContext _db;

    public GetCurrentUserQueryHandler(IAppDbContext db) => _db = db;

    public async Task<CurrentUserDto> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.AdminUsers
            .AsNoTracking()
            .Where(x => x.Id == request.UserId)
            .Select(x => new CurrentUserDto(x.Id, x.Username, x.FullName, x.MustChangePassword, x.LastLoginAt))
            .FirstOrDefaultAsync(cancellationToken);

        return user ?? throw new NotFoundException(nameof(AdminUser), request.UserId);
    }
}
