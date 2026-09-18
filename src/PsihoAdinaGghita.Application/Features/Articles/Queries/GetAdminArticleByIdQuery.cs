using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Articles.Dtos;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Articles.Queries;

/// <summary>Articolul complet pentru formularul de editare (indiferent de status).</summary>
public record GetAdminArticleByIdQuery(int Id) : IRequest<AdminArticleDetailDto>;

public class GetAdminArticleByIdQueryValidator : AbstractValidator<GetAdminArticleByIdQuery>
{
    public GetAdminArticleByIdQueryValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0)
            .WithMessage("Identificatorul articolului este invalid.");
    }
}

public class GetAdminArticleByIdQueryHandler : IRequestHandler<GetAdminArticleByIdQuery, AdminArticleDetailDto>
{
    private readonly IAppDbContext _db;

    public GetAdminArticleByIdQueryHandler(IAppDbContext db) => _db = db;

    public async Task<AdminArticleDetailDto> Handle(
        GetAdminArticleByIdQuery request,
        CancellationToken cancellationToken)
    {
        var row = await _db.Articles
            .AsNoTracking()
            .Where(a => a.Id == request.Id)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Slug,
                a.Excerpt,
                a.ContentHtml,
                a.CoverImageUrl,
                a.CoverImageAlt,
                a.CategoryId,
                a.Status,
                a.PublishedAt,
                a.MetaTitle,
                a.MetaDescription,
                a.ReadingMinutes,
                a.ViewCount,
                a.CreatedAt,
                a.UpdatedAt,
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (row is null)
            throw new NotFoundException(nameof(Article), request.Id);

        return new AdminArticleDetailDto
        {
            Id = row.Id,
            Title = row.Title,
            Slug = row.Slug,
            Excerpt = row.Excerpt,
            ContentHtml = row.ContentHtml,
            CoverImageUrl = row.CoverImageUrl,
            CoverImageAlt = row.CoverImageAlt,
            CategoryId = row.CategoryId,
            Status = row.Status.ToString(),
            PublishedAt = row.PublishedAt,
            MetaTitle = row.MetaTitle,
            MetaDescription = row.MetaDescription,
            ReadingMinutes = row.ReadingMinutes,
            ViewCount = row.ViewCount,
            CreatedAt = row.CreatedAt,
            UpdatedAt = row.UpdatedAt,
        };
    }
}
