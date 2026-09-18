using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Faq.Dtos;

namespace PsihoAdinaGghita.Application.Features.Faq.Queries;

public record GetActiveFaqQuery : IRequest<IReadOnlyList<FaqItemDto>>;

public class GetActiveFaqQueryHandler : IRequestHandler<GetActiveFaqQuery, IReadOnlyList<FaqItemDto>>
{
    private readonly IAppDbContext _db;
    public GetActiveFaqQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<FaqItemDto>> Handle(
        GetActiveFaqQuery request,
        CancellationToken cancellationToken)
    {
        return await _db.FaqItems
            .AsNoTracking()
            .Where(f => f.IsActive)
            .OrderBy(f => f.DisplayOrder)
            .ThenBy(f => f.Id)
            .Select(f => new FaqItemDto(
                f.Id,
                f.Question,
                f.AnswerHtml,
                f.DisplayOrder))
            .ToListAsync(cancellationToken);
    }
}
