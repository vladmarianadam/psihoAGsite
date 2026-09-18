using MediatR;
using Microsoft.EntityFrameworkCore;
using PsihoAdinaGghita.Application.Common.Interfaces;
using PsihoAdinaGghita.Application.Features.Testimonials.Dtos;

namespace PsihoAdinaGghita.Application.Features.Testimonials.Queries;

public record GetAdminTestimonialsQuery : IRequest<IReadOnlyList<AdminTestimonialDto>>;

public class GetAdminTestimonialsQueryHandler
    : IRequestHandler<GetAdminTestimonialsQuery, IReadOnlyList<AdminTestimonialDto>>
{
    private readonly IAppDbContext _db;
    public GetAdminTestimonialsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<AdminTestimonialDto>> Handle(
        GetAdminTestimonialsQuery request,
        CancellationToken cancellationToken)
    {
        // În admin apar și cele neaprobate, cele în așteptare primele.
        return await _db.Testimonials
            .AsNoTracking()
            .OrderBy(t => t.IsApproved)
            .ThenBy(t => t.DisplayOrder)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new AdminTestimonialDto(
                t.Id,
                t.AuthorName,
                t.AuthorRole,
                t.Text,
                t.Rating,
                t.DisplayOrder,
                t.IsApproved,
                t.CreatedAt,
                t.UpdatedAt))
            .ToListAsync(cancellationToken);
    }
}
