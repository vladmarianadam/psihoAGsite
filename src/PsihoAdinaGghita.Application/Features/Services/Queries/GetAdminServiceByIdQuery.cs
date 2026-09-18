using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Services.Dtos;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Services.Queries;

public record GetAdminServiceByIdQuery(int Id) : IRequest<AdminServiceDto>;

public class GetAdminServiceByIdQueryHandler : IRequestHandler<GetAdminServiceByIdQuery, AdminServiceDto>
{
    private readonly IAppDbContext _db;

    public GetAdminServiceByIdQueryHandler(IAppDbContext db) => _db = db;

    public async Task<AdminServiceDto> Handle(GetAdminServiceByIdQuery request, CancellationToken cancellationToken)
    {
        var row = await _db.Services
            .AsNoTracking()
            .Where(x => x.Id == request.Id)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Slug,
                x.ShortDescription,
                x.LongDescriptionHtml,
                x.Price,
                x.PriceUnit,
                x.DurationMinutes,
                x.IconName,
                x.ImageUrl,
                x.SessionMode,
                x.DisplayOrder,
                x.IsActive,
                x.CreatedAt,
                x.UpdatedAt,
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (row is null)
            throw new NotFoundException(nameof(Service), request.Id);

        return new AdminServiceDto(
            row.Id,
            row.Name,
            row.Slug,
            row.ShortDescription,
            row.LongDescriptionHtml,
            row.Price,
            row.PriceUnit,
            row.DurationMinutes,
            row.IconName,
            row.ImageUrl,
            row.SessionMode.ToString(),
            row.DisplayOrder,
            row.IsActive,
            row.CreatedAt,
            row.UpdatedAt);
    }
}
