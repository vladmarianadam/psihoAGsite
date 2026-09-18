using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Services.Dtos;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Services.Queries;

public record GetServiceBySlugQuery(string Slug) : IRequest<ServiceDetailDto>;

public class GetServiceBySlugQueryValidator : AbstractValidator<GetServiceBySlugQuery>
{
    public GetServiceBySlugQueryValidator()
    {
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(150)
            .WithMessage("Slug-ul serviciului este obligatoriu.");
    }
}

public class GetServiceBySlugQueryHandler : IRequestHandler<GetServiceBySlugQuery, ServiceDetailDto>
{
    private readonly IAppDbContext _db;

    public GetServiceBySlugQueryHandler(IAppDbContext db) => _db = db;

    public async Task<ServiceDetailDto> Handle(GetServiceBySlugQuery request, CancellationToken cancellationToken)
    {
        // Serviciile inactive nu sunt vizibile public — răspundem 404, nu 403 (plan §5).
        var row = await _db.Services
            .AsNoTracking()
            .Where(x => x.IsActive && x.Slug == request.Slug)
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
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (row is null)
            throw new NotFoundException(nameof(Service), request.Slug);

        return new ServiceDetailDto(
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
            row.DisplayOrder);
    }
}
