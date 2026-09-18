using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Exceptions;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Faq.Dtos;
using PsihoAdinaGghita.Domain.Entities;

namespace PsihoAdinaGghita.Application.Features.Faq.Queries;

public record GetAdminFaqItemByIdQuery(int Id) : IRequest<AdminFaqItemDto>;

public class GetAdminFaqItemByIdQueryHandler : IRequestHandler<GetAdminFaqItemByIdQuery, AdminFaqItemDto>
{
    private readonly IAppDbContext _db;
    public GetAdminFaqItemByIdQueryHandler(IAppDbContext db) => _db = db;

    public async Task<AdminFaqItemDto> Handle(
        GetAdminFaqItemByIdQuery request,
        CancellationToken cancellationToken)
    {
        var dto = await _db.FaqItems
            .AsNoTracking()
            .Where(f => f.Id == request.Id)
            .Select(f => new AdminFaqItemDto(
                f.Id,
                f.Question,
                f.AnswerHtml,
                f.DisplayOrder,
                f.IsActive,
                f.CreatedAt,
                f.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        return dto ?? throw new NotFoundException(nameof(FaqItem), request.Id);
    }
}
