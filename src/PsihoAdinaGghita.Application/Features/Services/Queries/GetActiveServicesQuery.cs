using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Services.Dtos;

namespace PsihoAdinaGghita.Application.Features.Services.Queries;

/// <summary>Serviciile active pentru site-ul public, ordonate după DisplayOrder apoi Name.</summary>
public record GetActiveServicesQuery : IRequest<IReadOnlyList<ServiceListItemDto>>;

public class GetActiveServicesQueryHandler : IRequestHandler<GetActiveServicesQuery, IReadOnlyList<ServiceListItemDto>>
{
    private readonly IAppDbContext _db;

    public GetActiveServicesQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<ServiceListItemDto>> Handle(GetActiveServicesQuery request, CancellationToken cancellationToken)
    {
        // SessionMode e persistat prin value converter, deci .ToString() nu se traduce în SQL:
        // proiectăm coloanele necesare și convertim enumul la text după materializare.
        var rows = await _db.Services
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Slug,
                x.ShortDescription,
                x.Price,
                x.PriceUnit,
                x.DurationMinutes,
                x.IconName,
                x.ImageUrl,
                x.SessionMode,
                x.DisplayOrder,
            })
            .ToListAsync(cancellationToken);

        return rows
            .Select(x => new ServiceListItemDto(
                x.Id,
                x.Name,
                x.Slug,
                x.ShortDescription,
                x.Price,
                x.PriceUnit,
                x.DurationMinutes,
                x.IconName,
                x.ImageUrl,
                x.SessionMode.ToString(),
                x.DisplayOrder))
            .ToList();
    }
}
