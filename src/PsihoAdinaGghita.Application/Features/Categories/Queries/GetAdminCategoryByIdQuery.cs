using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Categories.Dtos;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Categories.Queries;

public record GetAdminCategoryByIdQuery(int Id) : IRequest<AdminCategoryDto>;

public class GetAdminCategoryByIdQueryHandler : IRequestHandler<GetAdminCategoryByIdQuery, AdminCategoryDto>
{
    private readonly IAppDbContext _db;

    public GetAdminCategoryByIdQueryHandler(IAppDbContext db) => _db = db;

    public async Task<AdminCategoryDto> Handle(GetAdminCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var category = await _db.Categories
            .AsNoTracking()
            .Where(x => x.Id == request.Id)
            .Select(x => new AdminCategoryDto(
                x.Id,
                x.Name,
                x.Slug,
                x.Description,
                x.DisplayOrder,
                x.Articles.Count,
                x.CreatedAt,
                x.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        return category ?? throw new NotFoundException(nameof(Category), request.Id);
    }
}
