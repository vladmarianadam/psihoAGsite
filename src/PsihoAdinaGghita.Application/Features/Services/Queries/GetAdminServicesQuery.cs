using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Services.Dtos;

namespace PsihoAdinaGghita.Application.Features.Services.Queries;

/// <summary>Toate serviciile pentru panoul de management, inclusiv cele inactive.</summary>
public record GetAdminServicesQuery : IRequest<IReadOnlyList<AdminServiceDto>>;

public class GetAdminServicesQueryHandler : IRequestHandler<GetAdminServicesQuery, IReadOnlyList<AdminServiceDto>>
{
    private readonly IAppDbContext _db;

    public GetAdminServicesQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<AdminServiceDto>> Handle(GetAdminServicesQuery request, CancellationToken cancellationToken)
    {
        var rows = await _db.Services
            .AsNoTracking()
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Name)
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
            .ToListAsync(cancellationToken);

        return rows
            .Select(x => new AdminServiceDto(
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
                x.SessionMode.ToString(),
                x.DisplayOrder,
                x.IsActive,
                x.CreatedAt,
                x.UpdatedAt))
            .ToList();
    }
}
