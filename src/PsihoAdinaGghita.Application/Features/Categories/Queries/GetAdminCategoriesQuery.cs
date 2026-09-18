using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Categories.Dtos;

namespace PsihoAdinaGghita.Application.Features.Categories.Queries;

/// <summary>Categoriile pentru panoul de management, cu numărul total de articole (inclusiv draft).</summary>
public record GetAdminCategoriesQuery : IRequest<IReadOnlyList<AdminCategoryDto>>;

public class GetAdminCategoriesQueryHandler : IRequestHandler<GetAdminCategoriesQuery, IReadOnlyList<AdminCategoryDto>>
{
    private readonly IAppDbContext _db;

    public GetAdminCategoriesQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<AdminCategoryDto>> Handle(GetAdminCategoriesQuery request, CancellationToken cancellationToken)
    {
        return await _db.Categories
            .AsNoTracking()
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Name)
            .Select(x => new AdminCategoryDto(
                x.Id,
                x.Name,
                x.Slug,
                x.Description,
                x.DisplayOrder,
                x.Articles.Count,
                x.CreatedAt,
                x.UpdatedAt))
            .ToListAsync(cancellationToken);
    }
}
