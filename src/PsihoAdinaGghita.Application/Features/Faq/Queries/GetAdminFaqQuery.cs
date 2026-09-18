using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Faq.Dtos;

namespace PsihoAdinaGghita.Application.Features.Faq.Queries;

public record GetAdminFaqQuery : IRequest<IReadOnlyList<AdminFaqItemDto>>;

public class GetAdminFaqQueryHandler : IRequestHandler<GetAdminFaqQuery, IReadOnlyList<AdminFaqItemDto>>
{
    private readonly IAppDbContext _db;
    public GetAdminFaqQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<AdminFaqItemDto>> Handle(
        GetAdminFaqQuery request,
        CancellationToken cancellationToken)
    {
        return await _db.FaqItems
            .AsNoTracking()
            .OrderBy(f => f.DisplayOrder)
            .ThenBy(f => f.Id)
            .Select(f => new AdminFaqItemDto(
                f.Id,
                f.Question,
                f.AnswerHtml,
                f.DisplayOrder,
                f.IsActive,
                f.CreatedAt,
                f.UpdatedAt))
            .ToListAsync(cancellationToken);
    }
}
