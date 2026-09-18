using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Common.Models;
using PsihoAdinaGghita.Application.Features.Media.Dtos;

namespace PsihoAdinaGghita.Application.Features.Media.Queries;

public record GetMediaAssetsQuery(int Page = 1, int PageSize = 24) : IRequest<PagedResult<MediaAssetDto>>;

public class GetMediaAssetsQueryValidator : AbstractValidator<GetMediaAssetsQuery>
{
    public GetMediaAssetsQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1)
            .WithMessage("Pagina trebuie să fie cel puțin 1.");

        RuleFor(x => x.PageSize).InclusiveBetween(1, 50)
            .WithMessage("Numărul de elemente pe pagină trebuie să fie între 1 și 50.");
    }
}

public class GetMediaAssetsQueryHandler : IRequestHandler<GetMediaAssetsQuery, PagedResult<MediaAssetDto>>
{
    private readonly IAppDbContext _db;
    public GetMediaAssetsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<PagedResult<MediaAssetDto>> Handle(GetMediaAssetsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.MediaAssets.AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.UploadedAt)
            .ThenByDescending(x => x.Id)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new MediaAssetDto(
                x.Id,
                x.FileName,
                x.Url,
                x.ContentType,
                x.SizeBytes,
                x.AltText,
                x.UploadedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<MediaAssetDto>(items, request.Page, request.PageSize, totalCount);
    }
}
